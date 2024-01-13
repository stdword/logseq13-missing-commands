import '@logseq/libs'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'


type MarkUp = [string, string][] & {wrappedWith?: string}
const MARKUP: {[type: string]: MarkUp } = {
    // first pair is for wrapping, others — for unwrapping
    bold:          [['**', '**'],        ['<b>', '</b>']],
    italics:        [['_', '_'],           ['*', '*'],       ['<i>', '</i>']],
    strikethrough: [['~~', '~~'],        ['<s>', '</s>']],
    highlight:    [['==', '=='],     ['<mark>', '</mark>']],
    underline:  [['<ins>', '</ins>'],    ['<u>', '</u>']],
    code:           [['`', '`'],      ['<code>', '</code>']],
}

const TRIM_BEGIN = [
    /^\s+/,

    /^#{1,6} /,

    /^\s*[-+*] /,
    /^\s*[-+*] \[.\] /,
    /^>/,

    /^(LATER|TODO) (\[#(A|B|C)\])?/,
    /^(NOW|DOING) (\[#(A|B|C)\])?/,
    /^DONE (\[#(A|B|C)\])?/,
    /^(WAIT|WAITING) (\[#(A|B|C)\])?/,
    /^(CANCELED|CANCELLED) (\[#(A|B|C)\])?/,
    /^\[#(A|B|C)\]/,

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

    // /\]\(.+?\)$/,          // link to page
    /\]\(\[\[.+?\]\]\)$/,  // link to page

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

function isMarkedUp(line: string, markup: MarkUp, selectPosition: [number, number]) {
    // note: may change markup
    // assertion:: selectPosition should be already trimmed, so markup is always OUTside

    const [start, end] = selectPosition
    for (const [i, [frontMarkup, backMarkup]] of Object.entries(markup)) {
        if (start < frontMarkup.length)
            continue
        if (end + backMarkup.length > line.length)
            continue

        const charsBefore = line.slice(start - frontMarkup.length, start)
        const charsAfter = line.slice(end, end + backMarkup.length)
        if (charsBefore === frontMarkup && charsAfter === backMarkup) {
            markup.wrappedWith = i
            Object.defineProperty(markup, 'wrappedWith', {enumerable: false})
            return true
        }
    }

    return false
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

    let wordEdge
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

            if (isMarkedUp(line, [[L, R]] as MarkUp, [start, end])) {
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

    if (isMarkedUp(line, markup, selectPosition)) {
        const [frontMarkup, backMarkup] = markup[markup.wrappedWith!]
        selectPosition[0] -= frontMarkup.length
        selectPosition[1] -= frontMarkup.length
        return line.slice(0, start - frontMarkup.length) + selection + line.slice(end + backMarkup.length)
    } else {
        const [frontMarkup, backMarkup] = markup[0]
        selectPosition[0] += frontMarkup.length
        selectPosition[1] += frontMarkup.length
        return line.slice(0, start) + frontMarkup + selection + backMarkup + line.slice(end)
    }
}

function wrap(block: BlockEntity, content: string, markup: MarkUp) {
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

export function magicBold(content, level, block, parent) {
    return wrap(block, content, MARKUP.bold)
}

export function magicItalics(content, level, block, parent) {
    return wrap(block, content, MARKUP.italics)
}

export function magicStrikethrough(content, level, block, parent) {
    return wrap(block, content, MARKUP.strikethrough)
}

export function magicHighlight(content, level, block, parent) {
    return wrap(block, content, MARKUP.highlight)
}

export function magicUnderline(content, level, block, parent) {
    return wrap(block, content, MARKUP.underline)
}

export function magicCode(content, level, block, parent) {
    return wrap(block, content, MARKUP.code)
}
