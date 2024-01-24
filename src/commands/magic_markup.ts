import '@logseq/libs'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'


class MarkUp implements Iterable<[string, string]> {
    public wrap: [string, string]
    public alternativeWrap: [string, string]
    public unwrap: [string, string][]

    public wrappedWith?: string
    public alternativeWrapWhenMatch?: RegExp

    constructor({ wrap, unwrap, alternativeWrapWhenMatch, alternativeWrapIndex }: {
        wrap: [string, string]
        unwrap: ([string, string] | null)[]
        alternativeWrapWhenMatch?: RegExp
        alternativeWrapIndex?: number
    }) {
        this.wrap = wrap
        this.unwrap = unwrap.map((item) => item === null ? wrap : item)
        if (!this.unwrap.includes(wrap))
            this.unwrap.splice(0, 0, wrap)
        this.wrappedWith = undefined
        this.alternativeWrapWhenMatch = alternativeWrapWhenMatch
        this.alternativeWrap = this.unwrap[alternativeWrapIndex ?? 1]
    }

    [Symbol.iterator]() {
        let index = 0
        return {
            next: () => {
                return {
                    done: index >= this.unwrap.length,
                    value: this.unwrap[index++],
                }
            }
        }
    }
    getWrapFor(selection: string) {
        if (this.alternativeWrapWhenMatch && this.alternativeWrapWhenMatch.test(selection))
            return this.alternativeWrap
        return this.wrap
    }
    getUnwrapFor(line: string, selectPosition: [number, number]): [string, string] | null {
        // Assertion: selectPosition should be already trimmed, so markup is always OUTside

        for (const markup of this.unwrap)
            if (MarkUp.isMarkedUpWith(line, selectPosition, markup))
                return markup
        return null
    }
    static isMarkedUpWith(line: string, selectPosition: [number, number], markup: [string, string]): boolean {
        const [start, end] = selectPosition
        const [frontMarkup, backMarkup] = markup

        if (start < frontMarkup.length)
            return false
        if (end + backMarkup.length > line.length)
            return false

        const charsBefore = line.slice(start - frontMarkup.length, start)
        const charsAfter = line.slice(end, end + backMarkup.length)
        return charsBefore === frontMarkup && charsAfter === backMarkup
    }
}

export const MARKUP: {[type: string]: MarkUp } = {
    bold: new MarkUp({
        wrap:     ['**', '**'],
        unwrap: [['<b>', '</b>']] }),
    italics: new MarkUp({
        wrap:    ['_', '_'],
        unwrap: [['*', '*'], ['<i>', '</i>']] }),
    strikethrough: new MarkUp({
        wrap:     ['~~', '~~'],
        unwrap: [['<s>', '</s>']] }),
    highlight: new MarkUp({
        wrap:        ['==', '=='],
        unwrap: [['<mark>', '</mark>']] }),
    underline: new MarkUp({
        wrap:  ['<ins>', '</ins>'],
        unwrap: [['<u>', '</u>']] }),
    code: new MarkUp({
        wrap:         ['`', '`'],
        unwrap: [['<code>', '</code>']] }),
    ref: new MarkUp({
        wrap:     ['[[', ']]'],
        unwrap: [['#[[', ']]'], null, ['#', '']] }),
    tag: new MarkUp({
        wrap: ['#', ''],
        unwrap: [['#[[', ']]'], ['[[', ']]']],
        alternativeWrapWhenMatch: /\s+/,
        alternativeWrapIndex: 1, }),
}

const TRIM_BEGIN = [
    /^\s+/,              // spaces at the beginning

    /^#{1,6} /,          // headings

    /^\s*[-+*] /,        // list item
    /^\s*[-+*] \[.\] /,  // list item with markdown task
    /^>/,                // quote

    // logseq tasks
    /^(LATER|TODO) (\[#(A|B|C)\])?/,
    /^(NOW|DOING) (\[#(A|B|C)\])?/,
    /^DONE (\[#(A|B|C)\])?/,
    /^(WAIT|WAITING) (\[#(A|B|C)\])?/,
    /^(CANCELED|CANCELLED) (\[#(A|B|C)\])?/,

    /^\[#(A|B|C)\]/,  // non-task blocks with priorities

    /^\s*[^\s:;,^@#~"`/|\\(){}[\]]+:: /u,  // property without value
    /^\s*DEADLINE: <[^>]+>$/,
    /^\s*SCHEDULED: <[^>]+>$/,
]
const TRIM_BEGIN_SELECTION_ADDITION = [
    /^\s*[^\s:;,^@#~"`/|\\(){}[\]]+:: .*$/u,  // property with value
]
const TRIM_BEFORE: (string | RegExp)[] = [
    /^\(\([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)\)/,  // block ref
    /^{{\w+.*?}}/,  // macro call

    /^\s/,
]
const TRIM_AFTER: (string | RegExp)[] = [
    /\!\[.*?\]\(.+?\){.*?}$/,  // link to image
    /\!\[.*?\]\(.+?\)$/,       // link to image

    // /\]\(.+?\)$/,           // link to page
    /\]\(\[\[.+?\]\]\)$/,      // link to page

    /\]\(\(\([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)\)\)$/,  // link to block
    /\(\([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)\)$/,  // block ref

    /{{\w+.*?}}$/,  // macro call

    /\s$/,

    /\]\($/, // to not break markdown links
]
const EXPAND_WHEN_OUTSIDE = [
    // this is OR groups
    // order is expansion direction

    [ // order is exceptional priority
        ['$', ''],
        ['', '$'],
        ['', '€'],
    ],

    [
        ['\"', '\"'],
        ["'", "'"],
        ["«", "»"],
    ],

    [
        ['#[[', ']]'],
        ['#', ''],
        ['[[', ']]'],
    ],
]


function trim(line: string, markup: MarkUp, selectPosition: [number, number], isSelectionMode: boolean) {
    let [start, end] = selectPosition

    let trimBegin = TRIM_BEGIN
    if (!isSelectionMode)
        trimBegin = TRIM_BEGIN_SELECTION_ADDITION.concat(trimBegin)

    // begin: once
    for (const re of trimBegin) {
        const m = line.match(re)
        if (m) {
            const match = m[0]
            start = Math.max(start, match.length)
            break
        }
    }

    let selection = line.slice(start, end)

    const trimBefore = Array.from(TRIM_BEFORE)
    const trimAfter = Array.from(TRIM_AFTER)

    for (const [frontMarkup, backMarkup] of markup) {
        trimBefore.push(frontMarkup)
        trimAfter.push(backMarkup)
    }

    // before
    while (true) {
        let wasTrimmed = false
        trimBefore.forEach(strOrRE => {
            if (!strOrRE)
                return

            if (typeof strOrRE === 'string') {
                if (selection.startsWith(strOrRE)) {
                    selection = selection.slice(strOrRE.length)
                    start += strOrRE.length
                    wasTrimmed = true
                }
            } else {
                const m = strOrRE.exec(selection)
                if (m) {
                    selection = selection.slice(m[0].length)
                    start += m[0].length
                    wasTrimmed = true
                }
            }
        })
        if (!wasTrimmed || selection.length === 0)
            break
    }

    // after
    while (true) {
        let wasTrimmed = false
        trimAfter.forEach((strOrRE) => {
            if (!strOrRE)
                return

            if (typeof strOrRE === 'string') {
                if (selection.endsWith(strOrRE)) {
                    selection = selection.slice(0, -strOrRE.length)
                    end -= strOrRE.length
                    wasTrimmed = true
                }
            } else {
                const m = strOrRE.exec(selection)
                if (m) {
                    selection = selection.slice(0, -m[0].length)
                    end -= m[0].length
                    wasTrimmed = true
                }
            }
        })
        if (!wasTrimmed || !selection.length)
            break
    }

    selectPosition[0] = start
    selectPosition[1] = end
}

function wordAtPosition(line: string, position: number) {
    const wordLeftRegexp  =  /(?!_)[\p{Letter}\p{Number}'_-]*$/u
    const wordRightRegexp = /^[\p{Letter}\p{Number}'_-]*(?<!_)/u

    const mr = wordRightRegexp.exec(line.slice(position))!
    return [
        line.slice(0, position).search(wordLeftRegexp),
        position + mr[0].length,
    ]
}

function expand(line: string, markup: MarkUp, selectPosition: [number, number]) {
    let [start, end] = selectPosition

    let wordEdge: number
    [start, wordEdge] = wordAtPosition(line, start)
    if (wordEdge < end)
        [wordEdge, end] = wordAtPosition(line, end)
    else
        end = wordEdge

    function setSelection() {
        selectPosition[0] = start
        selectPosition[1] = end
    }

    setSelection()

    EXPAND_WHEN_OUTSIDE.forEach(group => {
        for (const pair of group) {
            const [L, R] = pair

            let skipPair = false
            for (const [frontMarkup, backMarkup] of markup)
                if (L === frontMarkup || R === backMarkup) {
                    // allow undoing of the syntax
                    skipPair = true
                    break
                }
            if (skipPair)
                break

            const trimLastSpace = Boolean(pair[2])

            if (MarkUp.isMarkedUpWith(line, [start, end], [L, R])) {
                start -= L.length
                end += R.length
                setSelection()
                break
            }
        }
    })
}

function applyMarkup(line: string, markup: MarkUp, selectPosition?: [number, number]): string {
    if (!line && !selectPosition)
        return ''

    const isSelectionMode = Boolean(selectPosition)
    if (!selectPosition)
        selectPosition = [0, line.length]

    trim(line, markup, selectPosition, isSelectionMode)
    if (isSelectionMode)
        expand(line, markup, selectPosition)

    let [start, end] = selectPosition
    if (start > end)
        return line  // no changes

    if (start === end) {
        if (!isSelectionMode)
            return line
    }

    let selection = line.slice(start, end)
    const wrappedWith = markup.getUnwrapFor(line, selectPosition)
    if (wrappedWith) {
        const [frontMarkup, backMarkup] = wrappedWith
        selectPosition[0] -= frontMarkup.length
        selectPosition[1] -= frontMarkup.length
        return line.slice(0, start - frontMarkup.length) + selection + line.slice(end + backMarkup.length)
    } else {
        const [frontMarkup, backMarkup] = markup.getWrapFor(selection)
        selectPosition[0] += frontMarkup.length
        selectPosition[1] += frontMarkup.length
        return line.slice(0, start) + frontMarkup + selection + backMarkup + line.slice(end)
    }
}

export function magicWrap(block: BlockEntity, content: string, markup: MarkUp) {
    if (!block._selectPosition)
        return content.split('\n').map((line) => applyMarkup(line, markup)).join('\n')

    let lineStartPosition = 0
    let newLineStartPosition = 0

    const selectStart = block._selectPosition[0]
    const selectEnd = block._selectPosition[1]
    const selectReversedEnd = content.length - selectEnd

    const wrapped = content.split('\n').map((line, index) => {
        if (index !== 0) {
            // \n sign
            lineStartPosition++
            newLineStartPosition++
        }

        const lineEndPosition = lineStartPosition + line.length

        // line completely before OR after selection OR on the edge
        if (
            lineEndPosition < selectStart ||
            selectEnd < lineStartPosition ||
            lineEndPosition === selectStart && selectEnd !== selectStart ||
            lineStartPosition === selectEnd && selectEnd !== selectStart
        ) {
            lineStartPosition += line.length
            newLineStartPosition += line.length
            return line
        }

        let wholeLine = false  // line inside selection
        if (selectStart < lineStartPosition && lineEndPosition < selectEnd)
            wholeLine = true

        const selectPositionLine: [number, number] = [
            Math.max(selectStart - lineStartPosition, 0),
            Math.min(selectEnd - lineStartPosition, line.length),
        ]
        const newLine = applyMarkup(line, markup, wholeLine ? undefined : selectPositionLine)

        if (!wholeLine) {
            // first line of selection
            if (lineStartPosition <= selectStart && selectStart <= lineEndPosition) {
                block._selectPosition[0] = newLineStartPosition + selectPositionLine[0]
            }
            // last line of selection
            if (lineStartPosition <= selectEnd && selectStart <= lineEndPosition) {
                block._selectPosition[1] = newLineStartPosition + selectPositionLine[1]
            }
        }

        lineStartPosition += line.length
        newLineStartPosition += newLine.length
        return newLine
    }).join('\n')

    return wrapped
}

export function magicQuotes(block: BlockEntity, content: string, quotes: string) {
    const wrap: [string, string] = [quotes[0], quotes[1]]
    const unwrap: ([string, string] | null)[] = [
        ['«', '»'], ['"', '"'], ["'", "'"], ['“', '“'], ['‘', '‘']]

    for (const [i, pair] of Object.entries(unwrap)) {
        if (pair && pair[0] == wrap[0] && pair[1] == wrap[1]) {
            unwrap.splice(Number(i), 1)
            break
        }
    }

    console.log('TRACING', {wrap, unwrap})

    const quotesMarkup = new MarkUp({wrap, unwrap})
    return magicWrap(block, content, quotesMarkup)
}
