import { BlockEntity, IBatchBlock, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { f, indexOfNth, p, sleep } from './other'


export async function getChosenBlocks(): Promise<[BlockEntity[], boolean]> {
    const selected = await logseq.Editor.getSelectedBlocks()
    if (selected)
        return [selected, true]

    const uuid = await logseq.Editor.checkEditing()
    if (!uuid)
        return [[], false]

    return [
        [await logseq.Editor.getBlock(uuid as string) as BlockEntity],
        false,
    ]
}

// export async function insertContent(
//     content: string,
//     options: {
//         positionOnArg?: number,
//         positionOnNthText?: {count: number, text: string},
//         positionBeforeText?: string,
//         positionAfterText?: string,
//         positionIndex?: number
//     } = {},
// ): Promise<boolean> {
//     // Bug-or-feature with Command Palette modal: Logseq exits editing state when modal appears
//     // To handle this: use selected blocks — the editing block turns to selected

//     const chosenBlock = await getChosenBlock()
//     if (!chosenBlock) {
//         console.warn(p`Attempt to insert content while not in editing state and no one block is selected`)
//         return false
//     }
//     const [ uuid, isSelectedState ] = chosenBlock

//     const { positionOnArg, positionOnNthText, positionBeforeText, positionAfterText, positionIndex } = options
//     let position: number | undefined
//     if (positionOnNthText) {
//         const { text, count } = positionOnNthText
//         position = indexOfNth(content, text, count) ?? content.length
//     }
//     else if (positionOnArg) {
//         let index = indexOfNth(content, ',', positionOnArg)
//         if (!index)  // fallback to first arg
//             index = indexOfNth(content, ',', 1)
//         if (!index)  // no args at all
//             index = content.length
//         else
//             index++ // shift 1 char from «,»

//         // consume spaces
//         while (/\s/.test(content[index]))
//             index++

//         position = index
//     }
//     else if (positionBeforeText) {
//         const index = content.indexOf(positionBeforeText)
//         if (index !== -1)
//             position = index
//     }
//     else if (positionAfterText) {
//         const index = content.indexOf(positionAfterText)
//         if (index !== -1)
//             position = index + positionAfterText.length
//     }
//     else if (positionIndex) {
//         const adjustedIndex = adjustIndexForLength(positionIndex, content.length)
//         if (adjustedIndex < content.length)  // skip adjustedIndex == content.length
//             position = adjustedIndex
//     }

//     if (isSelectedState) {
//         await logseq.Editor.updateBlock(uuid, content)
//         if (position !== undefined)
//             await logseq.Editor.editBlock(uuid, { pos: position })
//     } else {
//         await logseq.Editor.insertAtEditingCursor(content)

//         if (position !== undefined) {
//             // need delay before getting cursor position
//             await sleep(20)
//             const posInfo = await logseq.Editor.getEditingCursorPosition()

//             const relativePosition = posInfo!.pos - content.length + position
//             console.debug(
//                 p`Calculating arg position`,
//                 posInfo!.pos, '-', content.length, '+', position, '===', relativePosition,
//             )

//             // try non-API way
//             const done = setEditingCursorPosition(relativePosition)
//             if (!done) {
//                 // API way: need to exit to perform entering on certain position
//                 await logseq.Editor.exitEditingMode()
//                 await sleep(20)

//                 await logseq.Editor.editBlock(uuid, { pos: relativePosition })
//             }
//         }
//     }

//     return true
// }

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

        block.content = PropertiesUtils.deletePropertyFromString(block.content, name)
    }
    static deletePropertyFromString(content: string, name: string): string {
        // case when properties in content use different style of naming
        //   logseq-prop-name
        //   logseq_prop_name
        //   logseq_prop-name
        // all this names is the same for logseq → we should erase all
        for (const n of [name, name.replaceAll('-', '_'), name.replaceAll('_', '-')]) {
            const propRegexp = PropertiesUtils.propertyContentFormat({name: n})
            content = content.replaceAll(new RegExp(propRegexp, 'gim'), '')
        }
        return content
    }
    static deleteAllProperties(content: string): string {
        for (const name of PropertiesUtils.getPropertyNames(content))
            content = PropertiesUtils.deletePropertyFromString(content, name)
        return content
    }
    static getPropertyNames(text: string): string[] {
        const propertyNames: string[] = []
        const propertyLine = new RegExp(PropertiesUtils.propertyContentFormat({
            name: `([^${PropertiesUtils.propertyRestrictedChars}]+)`
        }), 'gim')
        text.replaceAll(propertyLine, (m, name) => {propertyNames.push(name); return m})
        return propertyNames
    }
}

/**
 * Scroll to block if it has disappeared from view
 */
export async function scrollToBlock(block: BlockEntity) {
    const position = (await logseq.Editor.getEditingCursorPosition())?.pos  // editing mode?
    const view = await logseq.App.queryElementRect(`.ls-block[blockid="${block.uuid}"]`)
    if (view && (view.top < 0 || view.bottom > top!.window.innerHeight)) {
        const page = await logseq.Editor.getPage(block.page.id) as PageEntity
        logseq.Editor.scrollToBlockInPage(page.name, block.uuid)

        // .scrollToBlockInPage exists editing mode — return to it if necessary
        if (position) {
            await sleep(250)
            await logseq.Editor.editBlock(block.uuid, {pos: position})
        }
    }
}

export async function ensureChildrenIncluded(node: BlockEntity): Promise<BlockEntity> {
    // @ts-expect-error
    if (node.children?.at(0)?.uuid)
        return node
    return (await logseq.Editor.getBlock(node.uuid, {includeChildren: true}))!
}

export async function replaceChildrenBlocksInTree(
    root: BlockEntity,
    transformChildrenCallback: (blocks: BlockEntity[]) => BlockEntity[],
): Promise<BlockEntity | null> {
    root = await ensureChildrenIncluded(root)
    if (!root || !root.children || root.children.length === 0)
        return null  // nothing to replace

    // METHOD: blocks removal to replace whole tree
    // but it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    const blocksWithPersistedID = findPropertyInTree(root as IBatchBlock, PropertiesUtils.idProperty)
    const blocksAndItsReferences = (await Promise.all(
        blocksWithPersistedID.map(async (b): Promise<[IBatchBlock, Number[]]> => {
            const references = await findBlockReferences((b as BlockEntity).uuid)
            return [b, references]
        })
    ))
    const blocksWithReferences = blocksAndItsReferences.filter(([b, rs]) => (rs.length !== 0))
    if (blocksWithReferences.length !== 0)
        return null  // blocks removal cannot be used


    const transformedBlocks = transformChildrenCallback(root.children as BlockEntity[])

    // root is the first block in page
    if (root.left.id === root.page.id) {
        const page = await logseq.Editor.getPage(root.page.id)
        await logseq.Editor.removeBlock(root.uuid)

        // logseq bug: cannot use sibling next to root to insert whole tree to a page
        //  so insert root of a tree separately from children
        let prepended = await logseq.Editor.insertBlock(
            page!.uuid, root.content,
            {properties: root.properties, before: true, customUUID: root.uuid},
        )
        if (!prepended) {
            // logseq bug: for empty pages need to change `before: true → false`
            prepended = (await logseq.Editor.insertBlock(
                page!.uuid, root.content,
                {properties: root.properties, before: false, customUUID: root.uuid},
            ))!
        }

        await logseq.Editor.insertBatchBlock(
            prepended.uuid, transformedBlocks as IBatchBlock[],
            {before: false, sibling: false, keepUUID: true},
        )
        return prepended
    }

    // use root to insert whole tree at once
    const oldChildren = root.children
    root.children = transformedBlocks

    // root is the first child for its parent
    if (root.left.id === root.parent.id) {
        let parentRoot = (await logseq.Editor.getBlock(root.parent.id))!
        await logseq.Editor.removeBlock(root.uuid)
        await logseq.Editor.insertBatchBlock(
            parentRoot.uuid, root as IBatchBlock,
            {before: true, sibling: false, keepUUID: true},
        )

        // restore original object
        root.children = oldChildren

        parentRoot = (await logseq.Editor.getBlock(parentRoot.uuid, {includeChildren: true}))!
        return parentRoot.children![0] as BlockEntity
    }

    // root is not first child of parent and is not first block on page: it has sibling
    const preRoot = (await logseq.Editor.getPreviousSiblingBlock(root.uuid))!
    await logseq.Editor.removeBlock(root.uuid)
    await logseq.Editor.insertBatchBlock(
        preRoot.uuid, root as IBatchBlock,
        {before: false, sibling: true, keepUUID: true},
    )

    // restore original object
    root.children = oldChildren

    return (await logseq.Editor.getNextSiblingBlock(preRoot.uuid))!
}

export async function transformSelectedBlocksWithMovements(
    blocks: BlockEntity[],
    transformCallback: (blocks: BlockEntity[]) => BlockEntity[],
) {
    // METHOD: blocks movement

    // Logseq sorts selected blocks, so the first is the most upper one
    let insertionPoint = blocks[0]

    // Logseq bug: selected blocks can be duplicated (but sorted!)
    //   just remove duplication
    blocks = blocks.filter((b, i, r) => r.at(i - 1)?.uuid !== b.uuid)

    const transformed = transformCallback(blocks)
    for (const block of transformed) {
        // Logseq don't add movement to history if there was no movement at all
        //   so we don't have to save API calls: just call .moveBlock on EVERY block
        await logseq.Editor.moveBlock(block.uuid, insertionPoint.uuid, {before: false})
        insertionPoint = block
    }
}

export async function transformSelectedBlocksCommand(
    blocks: BlockEntity[],
    transformCallback: (blocks: BlockEntity[]) => BlockEntity[],
    isSelectedState: boolean,
) {
    // CASE: all sorting blocks relates to one root block
    if (blocks.length === 1) {
        const tree = await ensureChildrenIncluded(blocks[0])
        if (!tree.children || tree.children.length === 0)
            return  // nothing to transform

        const newRoot = await replaceChildrenBlocksInTree(tree, transformCallback)
        if (newRoot) {  // successfully replaced
            if (isSelectedState)
                await logseq.Editor.selectBlock(newRoot.uuid)
            else
                await logseq.Editor.editBlock(newRoot.uuid)

            return
        }

        // fallback to array of blocks
        blocks = tree.children as BlockEntity[]
    }


    // CASE: selected blocks from different parents
    transformSelectedBlocksWithMovements(blocks, transformCallback)
}

// export async function walkBlockTreeAsync(
//     root: IBatchBlock,
//     callback: (b: IBatchBlock, lvl: number) => Promise<string | void>,
//     level: number = 0,
// ): Promise<IBatchBlock> {
//     return {
//         content: (await callback(root, level)) ?? '',
//         children: await Promise.all(
//             (root.children || []).map(
//                 async (b) => await walkBlockTree(b as IBatchBlock, callback, level + 1)
//         ))
//     }
// }

export function walkBlockTree(
    root: IBatchBlock,
    callback: (b: IBatchBlock, lvl: number) => string | void,
    level: number = 0,
): IBatchBlock {
    return {
        content: callback(root, level) ?? '',
        children: (root.children || []).map(
            (b) => walkBlockTree(b as IBatchBlock, callback, level + 1)
        )
    }
}

export function findPropertyInTree(tree: IBatchBlock, propertyName: string): IBatchBlock[] {
    const found: IBatchBlock[] = []
    walkBlockTree(tree, (node, level) => {
        if (PropertiesUtils.hasProperty(node.content, propertyName))
            found.push(node)
    })
    return found
}

export async function findBlockReferences(uuid: string): Promise<Number[]> {
    const results = await logseq.DB.datascriptQuery(`
        [:find (pull ?b [:db/id])
         :where
            [?b :block/content ?c]
            [(clojure.string/includes? ?c "((${uuid}))")]
        ]`)
    if (!results)
        return []
    return results.flat().map((item) => item.id)
}
