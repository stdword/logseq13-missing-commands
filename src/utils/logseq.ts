import { BlockEntity, IBatchBlock, PageEntity } from '@logseq/libs/dist/LSPlugin.user'

import { f, indexOfNth, p, sleep, unique } from './other'


export async function getChosenBlocks(): Promise<[BlockEntity[], boolean]> {
    const selected = await logseq.Editor.getSelectedBlocks()
    if (selected)
        return [selected, true]

    const uuid = await logseq.Editor.checkEditing()
    if (!uuid)
        return [[], false]

    const editingBlock = await logseq.Editor.getBlock(uuid as string) as BlockEntity

    // to get ahead of Logseq block content saving process
    editingBlock.content = await logseq.Editor.getEditingBlockContent()

    return [ [editingBlock], false ]
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

export function getEditingCursorSelection() {
    const editorElement = top!.document.getElementsByClassName('editor-wrapper')[0] as HTMLDivElement
    if (!editorElement)
        return null

    const textAreaElement = top!.document.getElementById(
        editorElement.id.replace(/^editor-/, '')
    ) as HTMLTextAreaElement
    if (!textAreaElement)
        return null

    return [textAreaElement.selectionStart, textAreaElement.selectionEnd]
}


export class PropertiesUtils {
    static readonly idProperty = 'id'
    static readonly headingProperty = 'heading'
    static readonly numberingProperty = 'logseq.orderListType'
    static readonly numberingProperty_ = 'logseq.order-list-type'

    // source: https://github.com/logseq/logseq/blob/master/deps/graph-parser/src/logseq/graph_parser/property.cljs#L81
    // logseq.* prefix need to be checked separately
    static readonly systemBlockProperties = [
        'id', 'heading', 'collapsed',
        'created-at', 'created_at',
        'updated-at', 'last-modified-at', 'last_modified_at',
    ]

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
    static fromCamelCase(text: string): string {
        return text.replaceAll(
            /\p{Uppercase_Letter}\p{Lowercase_Letter}/gu,
            (m) => '-' + m.toLowerCase(),
        )
    }
    static fromCamelCaseAll(properties: Record<string, any> | undefined) {
        return Object.fromEntries(
            Object.entries(properties ?? {})
                .map(([k, v]) => [PropertiesUtils.fromCamelCase(k), v])
        )
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

export async function getBlocksWithReferences(root: BlockEntity): Promise<BlockEntity[]> {
    const blocksWithPersistedID = findPropertyInTree(root as IBatchBlock, PropertiesUtils.idProperty)
    const blocksAndItsReferences = (await Promise.all(
        blocksWithPersistedID.map(async (b): Promise<[BlockEntity, Number[]]> => {
            const block = b as BlockEntity
            const references = await findBlockReferences(block.uuid)
            return [block, references]
        })
    ))
    const blocksWithReferences = blocksAndItsReferences.filter(([b, rs]) => (rs.length !== 0))
    return blocksWithReferences.map(([b, rs]) => {
        b._references = rs
        return b
    })
}

export async function transformBlocksTreeByReplacing(
    root: BlockEntity,
    transformChildrenCallback: (blocks: BlockEntity[]) => BlockEntity[],
): Promise<BlockEntity | null> {
    root = await ensureChildrenIncluded(root)
    if (!root || !root.children || root.children.length === 0)
        return null  // nothing to replace

    // METHOD: blocks removal to replace whole tree
    // but it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    const blocksWithReferences = await getBlocksWithReferences(root)
    if (blocksWithReferences.length !== 0)
        return null  // blocks removal cannot be used

    const transformedBlocks = transformChildrenCallback(root.children as BlockEntity[])
    walkBlockTree({content: '', children: transformedBlocks as IBatchBlock[]}, (b, level) => {
        b.properties = PropertiesUtils.fromCamelCaseAll(b.properties ?? {})
    })

    // root is the first block in page
    if (root.left.id === root.page.id) {
        const page = await logseq.Editor.getPage(root.page.id)
        await logseq.Editor.removeBlock(root.uuid)

        // logseq bug: cannot use sibling next to root to insert whole tree to a page
        //  so insert root of a tree separately from children
        const properties = PropertiesUtils.fromCamelCaseAll(root.properties)
        let prepended = await logseq.Editor.insertBlock(
            page!.uuid, root.content,
            {properties, before: true, customUUID: root.uuid},
        )
        if (!prepended) {
            // logseq bug: for empty pages need to change `before: true → false`
            prepended = (await logseq.Editor.insertBlock(
                page!.uuid, root.content,
                {properties, before: false, customUUID: root.uuid},
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
    blocks = unique(blocks, (b) => b.uuid)

    const transformed = transformCallback(blocks)
    for (const block of transformed) {
        // Logseq don't add movement to history if there was no movement at all
        //   so we don't have to save API calls: just call .moveBlock on EVERY block
        await logseq.Editor.moveBlock(block.uuid, insertionPoint.uuid, {before: false})
        insertionPoint = block
    }
}

export async function walkBlockTreeAsync(
    root: WalkBlock,
    callback: (b: WalkBlock, lvl: number, data?: any) => Promise<string | void>,
    level: number = 0,
): Promise<WalkBlock> {
    const data = {node: root as IBatchBlock}
    return {
        data,
        content: (await callback(root, level, data)) ?? '',
        children: await Promise.all(
            (root.children || []).map(
                async (b) => await walkBlockTreeAsync(b, callback, level + 1)
        ))
    }
}

export type WalkBlock = IBatchBlock & {data?: any}
export function walkBlockTree(
    root: WalkBlock,
    callback: (b: WalkBlock, lvl: number, parent?: WalkBlock, data?: any) => string | void,
    level: number = 0,
    parent?: WalkBlock,
): WalkBlock {
    const data = {node: root as IBatchBlock}
    const content = callback(root, level, parent, data) ?? ''
    return {
        data,
        content,
        children: (root.children || []).map(
            (b) => walkBlockTree(b, callback, level + 1, root)
        ),
    }
}

export function reduceBlockTree(
    root: WalkBlock,
    callback: (b: WalkBlock, lvl: number, children: string[], data?: any) => string,
    level: number = 0,
): string {
    const children = (root.children || []).map(
        (b) => reduceBlockTree(b as WalkBlock, callback, level + 1)
    )
    return callback(root, level, children, root.data) ?? ''
}

export function findPropertyInTree(tree: IBatchBlock, propertyName: string): IBatchBlock[] {
    const found: IBatchBlock[] = []
    walkBlockTree(tree, (node, level) => {
        if (PropertiesUtils.hasProperty(node.content, propertyName))
            found.push(node)
    })
    return found
}
export function checkPropertyExistenceInTree(
    tree: IBatchBlock,
    {skipRoot = false, onlyUser = true }: { skipRoot?: boolean, onlyUser?: boolean },
): string[] {
    const found: string[] = []
    walkBlockTree(tree, (node, level) => {
        if (skipRoot && level === 0)
            return
        for (const name of Object.keys(node.properties ?? {})) {
            if (!found.includes(name))
                found.push(name)
        }
    })
    if (onlyUser)
        return found
            .filter((p) => !PropertiesUtils.systemBlockProperties.includes(p))
            .filter((p) => !/^logseq\..*/.test(p))
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

export function filterOutChildBlocks(blocks: BlockEntity[]): BlockEntity[] {
    const filtered: BlockEntity[] = []

    const uuids: string[] = []
    for (const block of blocks) {
        if (uuids.includes(block.uuid))
            continue

        walkBlockTree(block as IBatchBlock, (b, level) => {
            const block = b as BlockEntity
            if (!uuids.includes(block.uuid))
                uuids.push(block.uuid)
        })

        filtered.push(block)
    }

    return filtered
}

/**
 * Reason: logseq bug — `before: true` doesn't work for batch inserting
 */
export async function insertBatchBlockBefore(
    srcBlock: BlockEntity,
    blocks: IBatchBlock | IBatchBlock[],
    opts?: Partial<{
        keepUUID: boolean;
    }>
) {
    // logseq bug: two space cut off from 2, 3, ... lines of all inserting blocks
    //    so add fake two spaces to every line
    // issue: https://github.com/logseq/logseq/issues/10730
    let tree = blocks
    if (Array.isArray(blocks))
        tree = {content: '', children: blocks}
    walkBlockTree(tree as IBatchBlock, (b, level) => {
        b.content = b.content.trim().replaceAll(/\n^/gm, '\n  ')})

    // first block in a page
    if (srcBlock.left.id === srcBlock.page.id) {
        // there is bug with first block in page: use pseudo block
        // issue: https://github.com/logseq/logseq/issues/10871
        const first = ( await logseq.Editor.insertBlock(
            srcBlock.uuid, 'ø', {before: true, sibling: true}) )!
        const result = await logseq.Editor.insertBatchBlock(
            first.uuid, blocks, {before: false, sibling: true, ...opts})
        await logseq.Editor.removeBlock(first.uuid)
        return result
    }

    const prev = await logseq.Editor.getPreviousSiblingBlock(srcBlock.uuid)
    if (prev) {
        // special handling for numbering
        // issue: https://github.com/logseq/logseq/issues/10729
        let numbering = undefined
        let properties = {}
        if (prev.properties) {
            numbering = prev.properties[PropertiesUtils.numberingProperty]
            delete prev.properties[PropertiesUtils.numberingProperty]
            properties = PropertiesUtils.fromCamelCaseAll(prev.properties)
        }
        if (numbering)
            await logseq.Editor.removeBlockProperty(prev.uuid, PropertiesUtils.numberingProperty_)

        const inserted = await logseq.Editor.insertBatchBlock(
            prev.uuid, blocks, {before: false, sibling: true, ...opts})

        if (numbering)
            await logseq.Editor.upsertBlockProperty(prev.uuid, PropertiesUtils.numberingProperty_, numbering)

        return inserted
    }

    // first block for parent
    const parent = ( await logseq.Editor.getBlock(srcBlock.parent.id) )!

    // special handling for numbering
    // issue: https://github.com/logseq/logseq/issues/10729
    let numbering = undefined
    let properties = {}
    if (parent.properties) {
        numbering = parent.properties[PropertiesUtils.numberingProperty]
        delete parent.properties[PropertiesUtils.numberingProperty]
        properties = PropertiesUtils.fromCamelCaseAll(parent.properties)
    }
    if (numbering)
        await logseq.Editor.removeBlockProperty(parent.uuid, PropertiesUtils.numberingProperty_)

    const inserted = await logseq.Editor.insertBatchBlock(
        parent.uuid, blocks, {before: true, sibling: false, ...opts})

    if (numbering)
        await logseq.Editor.upsertBlockProperty(parent.uuid, PropertiesUtils.numberingProperty_, numbering)

    return inserted
}

export function setNativeValue(element, value, needToDispatch) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')!.set!
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!

    if (valueSetter && valueSetter !== prototypeValueSetter)
        prototypeValueSetter.call(element, value)
    else
        valueSetter.call(element, value)

    if (needToDispatch)
        element.dispatchEvent(new Event('input', {bubbles: true}))
}

export function provideStyle(key: string, style: string = '') {
    const emptyStyle = '/**/'
    if (!style)
        style = emptyStyle

    logseq.provideStyle({key, style})
    return () => {logseq.provideStyle({key, style: emptyStyle})}
}
