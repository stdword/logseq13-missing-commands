import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

import { f, indexOfNth, p, sleep } from './other'


/**
 * @returns pair [UUID, false] in case of currently editing block
 * @returns pair [UUID, true] in case of selected block (outside of editing mode)
 * @returns null in case of none of the blocks are selected (outside of editing mode)
 */
export async function getChosenBlock(): Promise<[string, boolean] | null> {
    const selected = (await logseq.Editor.getSelectedBlocks()) ?? []
    const editing = await logseq.Editor.checkEditing()
    if (!editing && selected.length === 0)
        return null

    const isSelectedState = selected.length !== 0
    const uuid = isSelectedState ? selected[0].uuid : editing as string
    return [ uuid, isSelectedState ]
}

export async function insertContent(
    content: string,
    options: {
        positionOnArg?: number,
        positionOnNthText?: {count: number, text: string},
        positionBeforeText?: string,
        positionAfterText?: string,
        positionIndex?: number
    } = {},
): Promise<boolean> {
    // Bug-or-feature with Command Palette modal: Logseq exits editing state when modal appears
    // To handle this: use selected blocks — the editing block turns to selected

    const chosenBlock = await getChosenBlock()
    if (!chosenBlock) {
        console.warn(p`Attempt to insert content while not in editing state and no one block is selected`)
        return false
    }
    const [ uuid, isSelectedState ] = chosenBlock

    const { positionOnArg, positionOnNthText, positionBeforeText, positionAfterText, positionIndex } = options
    let position: number | undefined
    if (positionOnNthText) {
        const { text, count } = positionOnNthText
        position = indexOfNth(content, text, count) ?? content.length
    }
    else if (positionOnArg) {
        let index = indexOfNth(content, ',', positionOnArg)
        if (!index)  // fallback to first arg
            index = indexOfNth(content, ',', 1)
        if (!index)  // no args at all
            index = content.length
        else
            index++ // shift 1 char from «,»

        // consume spaces
        while (/\s/.test(content[index]))
            index++

        position = index
    }
    else if (positionBeforeText) {
        const index = content.indexOf(positionBeforeText)
        if (index !== -1)
            position = index
    }
    else if (positionAfterText) {
        const index = content.indexOf(positionAfterText)
        if (index !== -1)
            position = index + positionAfterText.length
    }
    else if (positionIndex) {
        const adjustedIndex = adjustIndexForLength(positionIndex, content.length)
        if (adjustedIndex < content.length)  // skip adjustedIndex == content.length
            position = adjustedIndex
    }

    if (isSelectedState) {
        await logseq.Editor.updateBlock(uuid, content)
        if (position !== undefined)
            await logseq.Editor.editBlock(uuid, { pos: position })
    } else {
        await logseq.Editor.insertAtEditingCursor(content)

        if (position !== undefined) {
            // need delay before getting cursor position
            await sleep(20)
            const posInfo = await logseq.Editor.getEditingCursorPosition()

            const relativePosition = posInfo!.pos - content.length + position
            console.debug(
                p`Calculating arg position`,
                posInfo!.pos, '-', content.length, '+', position, '===', relativePosition,
            )

            // try non-API way
            const done = setEditingCursorPosition(relativePosition)
            if (!done) {
                // API way: need to exit to perform entering on certain position
                await logseq.Editor.exitEditingMode()
                await sleep(20)

                await logseq.Editor.editBlock(uuid, { pos: relativePosition })
            }
        }
    }

    return true
}

/**
 * Sets the current editing block cursor position.
 * There is no need to check boundaries.
 * Negative indexing is supported.
 *
 * @param `pos`: new cursor position
 * @usage
 *  setEditingCursorPosition(0) — set to the start
 *  setEditingCursorPosition(-1) — set to the end
 *  setEditingCursorPosition(-2) — set before the last char
 */
export function setEditingCursorPosition(pos: number) {
    return setEditingCursorSelection(pos, pos)
}

function adjustIndexForLength(i, len) {
    if (i > len)
        i = len
    if (i < (-len - 1))
        i = -len - 1
    if (i < 0)
        i += len + 1
    return i
}

export function setEditingCursorSelection(start: number, end: number) {
    const editorElement = top!.document.getElementsByClassName('editor-wrapper')[0] as HTMLDivElement
    if (!editorElement)
        return false
    const textAreaElement = top!.document.getElementById(
        editorElement.id.replace(/^editor-/, '')
    ) as HTMLTextAreaElement
    if (!textAreaElement)
        return false

    const length = textAreaElement.value.length
    start = adjustIndexForLength(start, length)
    end = adjustIndexForLength(end, length)

    textAreaElement.selectionStart = start
    textAreaElement.selectionEnd = end
    return true
}


export class PropertiesUtils {
    static readonly idProperty = 'id'
    static readonly headingProperty = 'heading'

    static propertyContentFormat = f`\n?^[^\\S]*${'name'}::.*$`
    static propertyRestrictedChars = '\\s:;,^@#~"`/|\\(){}[\\]'

    static toCamelCase(text: string): string {
        text = text.toLowerCase()
        text = text.replaceAll(/(?<=-)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll(/(?<=_)(\w)/g, (m, ch) => ch.toUpperCase())
        text = text.replaceAll('-', '')
        text = text.replaceAll('_', '')
        if (text)
            text = text[0].toLowerCase() + text.slice(1)
        return text
    }

    static hasProperty(blockContent: string, name: string): boolean {
        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            const exists = new RegExp(propRegexp, 'gim').test(blockContent)
            if (exists)
                return true
        }
        return false
    }
    static deleteProperty(block: BlockEntity, name: string): void {
        const nameCamelCased = PropertiesUtils.toCamelCase(name)

        if (block.properties)
            delete block.properties[nameCamelCased]
        if (block.propertiesTextValues)
            delete block.propertiesTextValues[nameCamelCased]

        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq → we should erase all
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            block.content = block.content.replaceAll(new RegExp(propRegexp, 'gim'), '')
        }
    }
}
