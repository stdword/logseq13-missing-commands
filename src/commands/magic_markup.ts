import '@logseq/libs'
import { BlockEntity } from '@logseq/libs/dist/LSPlugin'


const MARKUP: {[type: string]: [string, string]} = {
    code: ['`', '`'],
    bold: ['**', '**'],
    italics: ['*', '*'],
    strikethrough: ['~~', '~~'],
    hightlight: ['==', '=='],
    underline: ['<ins>', '</ins>'],
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

    /^\s*[^\s:;,^@#~"`/|\\(){}[\]]+:: /u,
    /^\s*DEADLINE: <[^>]+>$/,
    /^\s*SCHEDULED: <[^>]+>$/,
]
const TRIM_BEGIN_SELECTION_ADDITION = [
    /^\s*[^\s:;,^@#~"`/|\\(){}[\]]+:: .*$/u,
]


const TRIM_BEFORE = [
    '\"',
    '(',
    '[',
    ' ',
    '\t',
]

const TRIM_AFTER = [
    '\"',
    ')',
    ']',
    ' ',
    '\t',

    '](', // to not break markdown links
]

const EXPAND_WHEN_OUTSIDE = [
    ['#', ''],
    ['[[', ']]'],

    ['\"', '\"'],
    ["'", "'"],
    ["«", "»"],

    ['$', ''],
    ['', '$'],
    ['', '€'],

    // extra spaces are trimmed separately later, only there to avoid conflict with trimAfter values
    ['', ': ', 'trim_last_space'],
    ['(', ')'],
    ['[', '] ', 'trim_last_space'] // md link exception
]

// TODO trim logseq markup:
//  refs ((659d4f23-8d83-49fd-9bfb-c9eab32fa87d))
//  macro {{...}}
//  image: ![image.png](../assets/image_1687098889273_0.png){:height 200, :width 318}

// TODO special markdown:
//  code block
//  table
//  admonitions & special blocks: #+BEGIN_NOTE ... #+END_NOTE


function trim(line: string, markup: [string, string], selectPosition: [number, number], isSelectionMode: boolean): [number, number] {
    const [frontMarkup, backMarkup] = markup
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
    trimBefore.push(frontMarkup)
    trimAfter.push(backMarkup)

    // before
    while (true) {
        let wasTrimmed = false
        trimBefore.forEach(str => {
            if (selection.startsWith(str)) {
                selection = selection.slice(str.length)
                start += str.length
                wasTrimmed = true
            }
        })
        if (!wasTrimmed || selection.length === 0)
            break
    }

    // after
    while (true) {
        let wasTrimmed = false
        trimAfter.forEach((str) => {
            if (selection.endsWith(str)) {
                selection = selection.slice(0, -str.length)
                end -= str.length
                wasTrimmed = true
            }
        })
        if (!wasTrimmed || !selection.length)
            break
    }

    return [start, end]
}

function isMarkedUp(line: string, markup: [string, string], selectPosition: [number, number]) {
    // assertion:: selectPosition should be already trimmed, so markup is always OUTside

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

function expandSelection(line: string, markup: [string, string], selectPosition: [number, number]) {
    // expand to word
    const selectionInfo = getEditingCursorSelection()
    const selectionStart = selectionInfo ? selectionInfo[0] : 0
    const selectionEnd = selectionInfo ? selectionInfo[1] : selection.length

    const firstWord = wordAtPosition(selectionStart)
    let lastWord = wordAtPosition(selectionEnd)

    // has to come after trimming to include things like brackets
    const expandWhenOutside = constant.EXPANDWHENOUTSIDE;
    expandWhenOutside.forEach(pair => {
        if (pair[0] === frontMarkup || pair[1] === endMarkup )
            return; // allow undoing of the command creating the syntax
        const trimLastSpace = Boolean(pair[2]);

        if (isOutsideSel (pair[0], pair[1])) {
            firstWord.anchor.ch -= pair[0].length;
            lastWord.head.ch += pair[1].length;
            if (trimLastSpace) lastWord.head.ch--; // to avoid conflicts between trimming and expansion
            editor.setSelection(firstWord.anchor, lastWord.head);
        }
    });


    return { anchor: selectionStart, head: selectionEnd };
}

function applyMarkup(
    line: string,
    markup: [string, string],
    selectPosition?: [number, number],
): string {
    if (!line)
        return ''

    const [frontMarkup, backMarkup] = markup

    const isSelectionMode = Boolean(selectPosition)
    if (!selectPosition)
        selectPosition = [0, line.length]

    selectPosition = trim(line, markup, selectPosition, isSelectionMode)

    const [start, end] = selectPosition
    if (start > end)
        return line  // no changes

    if (start === end) {
        if (!isSelectionMode)
            return line

        // expand
    }

    let selection = line.slice(start, end)

    if (isMarkedUp(line, markup, selectPosition))
        return line.slice(0, start - frontMarkup.length) + selection + line.slice(end + backMarkup.length)
    else
        return line.slice(0, start) + frontMarkup + selection + backMarkup + line.slice(end)
}

function wrap(block: BlockEntity, content: string, markup: [string, string]) {
    if (!block._selectPosition)
        return content.split('\n').map((line) => applyMarkup(line, markup)).join('\n')

    let lineStartPosition = 0

    const selectStart = block._selectPosition[0]
    const selectEnd = block._selectPosition[1]

    return content.split('\n').map((line, index) => {
        if (index !== 0)
            lineStartPosition++  // \n sign

        const lineEndPosition = lineStartPosition + line.length

        // line completely before OR after selection OR on the edge
        if (
            lineEndPosition < selectStart ||
            selectEnd < lineStartPosition ||
            lineEndPosition === selectStart && selectEnd !== selectStart ||
            lineStartPosition === selectEnd && selectEnd !== selectStart
        ) {
            lineStartPosition += line.length
            return line
        }

        let wholeLine = false  // line inside selection
        if (selectStart < lineStartPosition && lineEndPosition < selectEnd)
            wholeLine = true

        const start = Math.max(selectStart - lineStartPosition, 0)
        const end = Math.min(selectEnd - lineStartPosition, line.length)
        const newLine = applyMarkup(
            line, markup,
            wholeLine ? undefined : [start, end],
        )

        if (line !== newLine) {
            // assumption: one line = one insertion / one erasing of markup
            const delta = newLine.length - line.length
            const sign = delta > 0 ? +1 : -1
            const lsize = markup[0].length
            const rsize = markup[1].length

            // this line contains selection's start
            if (selectStart >= lineStartPosition) {
                block._selectPosition[0] += lsize * sign
                block._selectPosition[1] += lsize * sign

                // this line contains selection's end
                if (! (selectEnd <= lineEndPosition) )
                    block._selectPosition[1] += rsize * sign
            } else {
                block._selectPosition[1] += lsize * sign

                // this line contains selection's end
                if (!( selectEnd <= lineEndPosition ))
                    block._selectPosition[1] += rsize * sign
            }
        }

        lineStartPosition += line.length
        return newLine
    }).join('\n')
}

export function magicBold(content, level, block, parent) {
    return wrap(block, content, MARKUP.bold)
}
