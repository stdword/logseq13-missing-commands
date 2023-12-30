import '@logseq/libs'

import markdownit from 'markdown-it'

import {
    PropertiesUtils, WalkBlock, checkPropertyExistenceInTree, ensureChildrenIncluded,
    escapeForRegExp, filterOutChildBlocks, getBlocksWithReferences,
    getChosenBlocks, insertBatchBlockBefore, isWindows, lettersToNumber,
    numberToLetters, numberToRoman, p, reduceBlockTree,
    reduceTextWithLength, scrollToBlock, sleep, transformBlocksTreeByReplacing,
    transformSelectedBlocksWithMovements, unique, walkBlockTree, walkBlockTreeAsync,
} from './utils'
import { BlockEntity, IBatchBlock } from '@logseq/libs/dist/LSPlugin'


// there is no `saw` emoji in Windows — use `kitchen knife`: it has the same colors
export const ICON = isWindows ? '🔪' : '🪚'

const md = markdownit('zero').enable([
    'paragraph',
    'text',
    'list',
    // 'newline',
], true)


export async function toggleAutoHeadingCommand(opts: {togglingBasedOnFirstBlock: boolean}) {
    const HEADING_REGEX = /^#+ /
    const PROPERTY = PropertiesUtils.headingProperty

    const [ blocks ] = await getChosenBlocks()
    if (blocks.length === 0)
        return

    const firstBlockHeading = blocks[0].properties?.heading

    for (const block of blocks) {
        if (HEADING_REGEX.test(block.content)) {
            block.content = block.content.replace(HEADING_REGEX, '')

            // ensure there is no `heading::`
            PropertiesUtils.deleteProperty(block, PROPERTY)

            if (opts.togglingBasedOnFirstBlock && !firstBlockHeading)
                block.content += '\nheading:: true'

            await logseq.Editor.updateBlock(block.uuid, block.content)
            await logseq.Editor.exitEditingMode(true)
            continue
        }

        const heading = opts.togglingBasedOnFirstBlock ? firstBlockHeading : block.properties?.heading
        if (!heading)
            await logseq.Editor.upsertBlockProperty(block.uuid, PROPERTY, true)
        else
            await logseq.Editor.removeBlockProperty(block.uuid, PROPERTY)
    }
}

export async function transformSelectedBlocksCommand(
    blocks: BlockEntity[],
    transformCallback: (blocks: BlockEntity[]) => BlockEntity[],
    isSelectedState: boolean,
) {
    // CASE: all transformed blocks relates to one root block
    if (blocks.length === 1) {
        const tree = await ensureChildrenIncluded(blocks[0])
        if (!tree.children || tree.children.length === 0)
            return  // nothing to transform

        const newRoot = await transformBlocksTreeByReplacing(tree, transformCallback)
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

export async function sortBlocksCommand(contextBlockUUID: string | null = null) {
    let blocks: BlockEntity[]
    let isSelectedState = true
    if (contextBlockUUID)
        blocks = [(await logseq.Editor.getBlock(contextBlockUUID))!]
    else
        [blocks, isSelectedState] = await getChosenBlocks()

    if (blocks.length === 0) {
        await logseq.UI.showMsg(
            `[:div
                [:b "${ICON} Sort Blocks Command"]
                [:p "Select some blocks to use the command"]]`,
            'warning',
            {timeout: 10000},
        )
        return
    }

    const comparer = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
    const sortBlocks = (blocks) => Array
        .from(blocks as BlockEntity[])
        .sort((a, b) => comparer(a.content, b.content))

    transformSelectedBlocksCommand(blocks, sortBlocks, isSelectedState)
}

export async function reverseBlocksCommand(contextBlockUUID: string | null = null) {
    let blocks: BlockEntity[]
    let isSelectedState = true
    if (contextBlockUUID)
        blocks = [(await logseq.Editor.getBlock(contextBlockUUID))!]
    else
        [blocks, isSelectedState] = await getChosenBlocks()

    if (blocks.length === 0) {
        await logseq.UI.showMsg(
            `[:div
                [:b "${ICON} Reverse Blocks Command"]
                [:p "Select some blocks to use the command"]]`,
            'warning',
            {timeout: 10000},
        )
        return
    }

    const reverseBlocks = (blocks) => Array
        .from(blocks as BlockEntity[])
        .reverse()

    transformSelectedBlocksCommand(blocks, reverseBlocks, isSelectedState)
}

export async function shuffleBlocksCommand(contextBlockUUID: string | null = null) {
    let blocks: BlockEntity[]
    let isSelectedState = true
    if (contextBlockUUID)
        blocks = [(await logseq.Editor.getBlock(contextBlockUUID))!]
    else
        [blocks, isSelectedState] = await getChosenBlocks()

    if (blocks.length === 0) {
        await logseq.UI.showMsg(
            `[:div
                [:b "${ICON} Shuffle Blocks Command"]
                [:p "Select some blocks to use the command"]]`,
            'warning',
            {timeout: 10000},
        )
        return
    }

    const shuffleBlocks = (blocks) => Array
        .from(blocks as BlockEntity[])
        .sort(() => Math.random() - 0.5)

    transformSelectedBlocksCommand(blocks, shuffleBlocks, isSelectedState)
}


export async function parentBlockCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    if (first.parent.id === first.page.id)
        return

    const parentBlock = await logseq.Editor.getBlock(first.parent.id) as BlockEntity
    await logseq.Editor.editBlock(parentBlock.uuid)
}

export async function lastChildBlockCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    const tree = await logseq.Editor.getBlock(first.uuid, {includeChildren: true}) as BlockEntity
    if (!tree.children || tree.children.length === 0)
        return

    const lastChild = tree.children!.at(-1)! as BlockEntity
    await logseq.Editor.editBlock(lastChild.uuid)
}

export async function previousSiblingBlockCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    const prevBlock = await logseq.Editor.getPreviousSiblingBlock(first.uuid)
    if (!prevBlock)
        return

    const cursorPosition = (await logseq.Editor.getEditingCursorPosition())?.pos
    await logseq.Editor.editBlock(
        prevBlock.uuid,
        cursorPosition ? {pos: cursorPosition} : undefined
    )
}

export async function nextSiblingBlockCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    const nextBlock = await logseq.Editor.getNextSiblingBlock(first.uuid)
    if (!nextBlock)
        return

    const cursorPosition = (await logseq.Editor.getEditingCursorPosition())?.pos
    await logseq.Editor.editBlock(
        nextBlock.uuid,
        cursorPosition ? {pos: cursorPosition} : undefined
    )
}

export async function editPreviousBlockCommand() {
    const [blocks] = await getChosenBlocks()
    let [current] = blocks
    if (!current)
        return

    let prevBlock = await logseq.Editor.getPreviousSiblingBlock(current.uuid)
    if (prevBlock) {
        let iteration = prevBlock
        while (true) {
            if (!iteration['collapsed?']) {
                const tree = await logseq.Editor.getBlock(iteration.uuid, {includeChildren: true}) as BlockEntity
                if (tree.children && tree.children.length !== 0) {
                    iteration = tree.children.at(-1) as BlockEntity
                    continue
                }
            }

            prevBlock = iteration
            break
        }
    } else {
        if (current.parent.id === current.page.id) {
            // no prev block at all → go to the start of current
            await logseq.Editor.editBlock(current.uuid, {pos: 0})
            return
        }

        const parent = await logseq.Editor.getBlock(current.parent.id) as BlockEntity
        prevBlock = parent
    }

    const cursorPosition = (await logseq.Editor.getEditingCursorPosition())?.pos
    await logseq.Editor.editBlock(
        (prevBlock as BlockEntity).uuid,
        cursorPosition ? {pos: cursorPosition} : undefined
    )
}

export async function editNextBlockCommand() {
    const [blocks] = await getChosenBlocks()
    let [current] = blocks
    if (!current)
        return

    let nextBlock: BlockEntity | null = null
    if (!current['collapsed?']) {
        const tree = await logseq.Editor.getBlock(current.uuid, {includeChildren: true}) as BlockEntity
        if (tree.children && tree.children.length !== 0)
            nextBlock = tree.children[0] as BlockEntity
    }

    if (!nextBlock) {
        let iteration = current
        while (true) {
            if (!nextBlock) {
                nextBlock = await logseq.Editor.getNextSiblingBlock(iteration.uuid)
                if (nextBlock)
                    break
            }

            if (iteration.parent.id === iteration.page.id)
                break

            const parent = await logseq.Editor.getBlock(iteration.parent.id) as BlockEntity
            iteration = parent

            nextBlock = await logseq.Editor.getNextSiblingBlock(parent.uuid)
            if (nextBlock)
                break
        }
    }

    if (!nextBlock) {
        // no next block at all → go to the end of current
        await logseq.Editor.editBlock(current.uuid)
        return
    }

    const cursorPosition = (await logseq.Editor.getEditingCursorPosition())?.pos
    await logseq.Editor.editBlock(
        (nextBlock as BlockEntity).uuid,
        cursorPosition ? {pos: cursorPosition} : undefined
    )
}


export async function moveToTopOfSiblingsCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    // already on top
    if (first.parent.id === first.left.id || first.left.id === first.page.id)
        return

    let topmost = first
    while (true) {
        const prev = await logseq.Editor.getPreviousSiblingBlock(topmost.uuid)
        if (!prev)
            break
        topmost = prev
    }

    await logseq.Editor.moveBlock(first.uuid, topmost.uuid, {before: true, children: false})
    await scrollToBlock(first)
}

export async function moveToBottomOfSiblingsCommand() {
    const [blocks] = await getChosenBlocks()
    const [first] = blocks
    if (!first)
        return

    let bottommost = first
    while (true) {
        const next = await logseq.Editor.getNextSiblingBlock(bottommost.uuid)
        if (!next)
            break
        bottommost = next
    }

    // already on bottom
    if (first.id === bottommost.id)
        return

    await logseq.Editor.moveBlock(first.uuid, bottommost.uuid, {before: false, children: false})
    await scrollToBlock(first)
}

export async function outdentChildrenCommand() {
    const [blocks] = await getChosenBlocks()
    for (const block of blocks) {
        const tree = await logseq.Editor.getBlock(block.uuid, {includeChildren: true})
        if (!tree)
            continue

        for (const child of (tree.children ?? []).toReversed()) {
            await logseq.Editor.moveBlock(
                (child as BlockEntity).uuid,
                block.uuid,
                {before: false, children: false},
            )
        }
    }
}


export function splitByLines(text: string): IBatchBlock[] {
    const textBlocks = text.split(/\n/)
    return textBlocks.map((tb) => {return {content: tb}})
}

export function splitByWords(text: string): IBatchBlock[] {
    const textBlocks = text.split(/[^\p{Lowercase_Letter}'-_]+/iu)
    return textBlocks.filter((tb) => !!tb).map((tb) => {return {content: tb}})
}

export function splitBySentences(text: string): IBatchBlock[] {
    const textBlocks = text.split(/(?<=[.!?…])\s+/)
    return textBlocks
        .map((tb) => tb.endsWith('.') ? tb.slice(0, -1) : tb)
        .map((tb) => {return {content: tb}})
}

export function magicSplit(text: string): IBatchBlock[] {
    // add special types of ordered lists for parser to recognize it
    // (1)  → 1)
    text = text.replaceAll(/^(\s*)\((\d{1,3}\)\s)/gm, '$1$2')
    // 1.2.3. → 1)
    text = text.replaceAll(/^(\s*)((\d|\p{Lowercase_Letter}){1,3}\.){2,10}\s/gmiu, '$11) ')  // $11 means $1 and 1
    // (1.2.3) → 1) and 1.2.3) → 1)
    text = text.replaceAll(/^(\s*)\(?((\d|\p{Lowercase_Letter}){1,3}\.){1,10}(\d|\p{Lowercase_Letter}){1,3}\)\s/gmiu, '$11) ')
    // a) → 1) and (a) → 1)
    text = text.replaceAll(/^(\s*)\(?(\p{Lowercase_Letter}{1,3})\)\s/gmiu, '$11) ')
    // a. → 1)
    text = text.replaceAll(/^(\s*)(\p{Lowercase_Letter}{1,3})\.\s/gmiu, '$11) ')

    // add special types of unordered lists for parser to recognize it
    // • → -
    text = text.replaceAll(/^(\s*)•\s*/gmu, '$1- ')

    const tokens = md.parse(text, {})
    console.debug(p`Parsed tokens`, Array.from(tokens))
    console.debug(p`HTML-view`, md.renderer.render(tokens, {}, {}))

    const results: IBatchBlock[] = []

    type State = {container: IBatchBlock, isForNumbering: boolean}
    const statesStack: State[] = []

    const initialState: State = {
        container: {content: '', children: results},
        isForNumbering: false,
    }
    let state = initialState

    function createBlock(content: string, opts: { numbering: boolean } = { numbering: false }) {
        const properties: {[name: string]: string} = {}
        if (opts.numbering)
            properties[PropertiesUtils.numberingProperty_] = 'number'
        return {content, children: [], properties}
    }

    while (true) {
        if (tokens.length === 0)
            break

        let token = tokens.shift()!

        switch (token!.type) {
            case 'paragraph_open': {
                const message = 'paragraph_open, inline, paragraph_close always comes along'

                token = tokens.shift()!
                if (token.type !== 'inline')
                    throw new Error(message)

                state.container.children!.push(
                    createBlock(token.content, {numbering: state.isForNumbering})
                )

                token = tokens.shift()!
                if (token.type !== 'paragraph_close')
                    throw new Error(message)

                break
            }

            case 'ordered_list_open':
            case 'bullet_list_open': {
                const isForNumbering = token.type === 'ordered_list_open'

                // items of ordered list are always child items
                // so try to get the parent block here
                const lastBlock = state.container.children!.at(-1)
                if (lastBlock) {
                    statesStack.push(state)
                    state = {container: lastBlock, isForNumbering}
                }
                else
                    state.isForNumbering = isForNumbering

                break
            }

            case 'ordered_list_close':
            case 'bullet_list_close':
                if (statesStack.length === 0) {
                    state = initialState
                    state.isForNumbering = false
                }
                else
                    state = statesStack.pop()!

                break

            case 'list_item_open':
            case 'list_item_close':
                break

            default:
                throw new Error(`Unknown token: ${token.type}`)
        }
    }

    return results
}

export async function splitBlocksCommand(
    splitCallback: (content: string) => IBatchBlock[],
    keepChildrenInFirstBlock: boolean = true,
    recursive: boolean = false,
) {
    let [ blocks, isSelectedState ] = await getChosenBlocks()
    if (blocks.length === 0)
        return

    blocks = unique(blocks, (b) => b.uuid)
    if (recursive) {
        blocks = await Promise.all(
            blocks.map(async (b) => {
                return (
                    await logseq.Editor.getBlock(b.uuid, {includeChildren: true})
                )!
            })
        )
        blocks = filterOutChildBlocks(blocks)
    }

    for (const block of blocks) {
        async function processBlock(b) {
            const block = b as BlockEntity

            const content = PropertiesUtils.deleteAllProperties(block.content)
            const batch = splitCallback(content)

            let head: IBatchBlock, tail: IBatchBlock[]
            if (keepChildrenInFirstBlock)
                [head, tail] = [batch[0], batch.slice(1)]
            else
                [tail, head] = [batch.slice(0, -1), batch.at(-1)!]

            if (content !== head.content) {  // has changes?
                const properties = PropertiesUtils.fromCamelCaseAll(block.properties)
                Object.assign(properties, head.properties ?? {})

                await logseq.Editor.updateBlock(block.uuid, head.content, {properties})
            }

            if (head.children && head.children.length !== 0)
                await logseq.Editor.insertBatchBlock(
                    block.uuid, head.children, {sibling: false})

            if (tail.length !== 0) {
                if (keepChildrenInFirstBlock)
                    await logseq.Editor.insertBatchBlock(
                        block.uuid, tail, {before: false, sibling: true})
                else
                    await insertBatchBlockBefore(block, tail)
            }
        }

        if (recursive)
            await walkBlockTreeAsync(block as IBatchBlock, async (b, level) => processBlock(b))
        else
            await processBlock(block)
    }

    if (isSelectedState) {
        await sleep(20)
        await logseq.Editor.exitEditingMode()
    }
}


export function joinAsSentences_Map(content, level): string {
    if (content && /(?<![.!?…])$/.test(content))
        content += '.'
    return content
}

export function joinViaNewLines_Attach(content, level, children): string {
    const childrenContent = children.join('\n')
    if (!content)
        return childrenContent
    return content + (childrenContent ? '\n' + childrenContent : '')
}

export function joinViaNewLines_Map(content, level): string {
    if (level <= 1)
        return content
    const prefix = '* '
    const shift = '  '.repeat(level - 1)
    return shift + prefix + content.replaceAll(/\n^/gm, '\n' + shift + ' '.repeat(prefix.length))
}

export function joinViaCommas_Attach(content, level, children): string {
    if (children.length === 0)
        return content

    const prefix = content ? content + (level === 0 ? ': ' : ', ') : ''
    return prefix + children.join(', ')
}

export function joinViaSpaces_Attach(content, level, children): string {
    if (children.length === 0)
        return content

    const prefix = content ? content + ' ' : ''
    return prefix + children.join(' ')
}

export async function joinBlocksCommand(
    independentMode: boolean,
    joinAttachCallback: (root: string, level: number, children: string[], block?: BlockEntity) => string,
    joinMapCallback?: (content: string, level: number, block: BlockEntity, parent?: BlockEntity) => string,
    opts: {shouldHandleSingleBlock: boolean} = {shouldHandleSingleBlock: false},
) {
    let [ blocks, isSelectedState ] = await getChosenBlocks()
    if (blocks.length === 0)
        return

    blocks = unique(blocks, (b) => b.uuid)
    blocks = await Promise.all(
        blocks.map(async (b) => {
            return (
                await logseq.Editor.getBlock(b.uuid, {includeChildren: true})
            )!
        })
    )
    blocks = filterOutChildBlocks(blocks)

    if (blocks.length === 0)
        return

    independentMode = independentMode || blocks.length === 1


    // it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    let noWarnings = true
    for (const block of blocks) {
        let blocksWithReferences = await getBlocksWithReferences(block)

        // root can have references (in independent mode), others — not
        const blocksWithReferences_noRoot = blocksWithReferences.filter((b) => b.uuid !== block.uuid)
        block._rootHasReferences = blocksWithReferences.length !== blocksWithReferences_noRoot.length

        if (independentMode)
            blocksWithReferences = blocksWithReferences_noRoot

        if (blocksWithReferences.length !== 0) {
            const html = blocksWithReferences.map((b) => {
                let content = PropertiesUtils.deleteAllProperties(b.content)
                content = reduceTextWithLength(content, 35)
                return `[:li [:i "${content}"]]`
            })
            await logseq.UI.showMsg(
                `[:div
                    [:b "${ICON} Join Blocks Command"]
                    [:p "There are blocks that have references from another blocks: "
                        [:ul ${html}]
                    ]
                    [:p "Remove references or select only blocks without them."]
                ]`,
                'warning',
                {timeout: 20000},
            )
            noWarnings = false
        }
    }
    if (!noWarnings)
        return


    // check for properties
    for (const block of blocks) {
        const names = checkPropertyExistenceInTree(block as IBatchBlock, {skipRoot: independentMode})
        if (names.length !== 0) {
            const html = names.map((name) => {
                return `[:li [:i "${PropertiesUtils.fromCamelCase(name)}"]]`
            })
            await logseq.UI.showMsg(
                `[:div
                    [:b "${ICON} Join Blocks Command"]
                    [:p "There are blocks that have properties (command can't handle them): "
                        [:ul ${html}]
                    ]
                    [:p "Remove properties or select only blocks without them."]
                ]`,
                'warning',
                {timeout: 20000},
            )
            noWarnings = false
        }
    }
    if (!noWarnings)
        return


    function reduceTree(block: IBatchBlock, { startLevel }: { startLevel: number }) {
        const preparedTree = walkBlockTree(block, (b, level, p, data) => {
            const content = PropertiesUtils.deleteAllProperties(b.content)
            return joinMapCallback
                ? joinMapCallback(
                    content, level, b as BlockEntity, p as BlockEntity | undefined)
                : content
        }, startLevel)

        const reducedContent = reduceBlockTree(preparedTree, (b, level, children, data) => {
            return joinAttachCallback(b.content, level, children, b.data.node as BlockEntity)
        }, startLevel)

        return reducedContent
    }

    if (independentMode) {
        for (const block of blocks) {
            // ensure .children always is array
            if (!block.children)
                block.children = []

            if (block.children.length === 0) {
                if (!opts.shouldHandleSingleBlock)
                    continue  // nothing to join
            }

            const content = reduceTree(block as IBatchBlock, {startLevel: 0})
            const properties = PropertiesUtils.fromCamelCaseAll(block.properties)

            if (block._rootHasReferences || block.children.length === 0) {
                await logseq.Editor.updateBlock(block.uuid, content, {properties})
                for (const child of block.children)
                    await logseq.Editor.removeBlock((child as BlockEntity).uuid)
            } else {
                await insertBatchBlockBefore(block, {content, properties})
                await logseq.Editor.removeBlock(block.uuid)
            }
        }
    } else {
        const top = blocks[0]
        const pseudoRoot: IBatchBlock = {content: '', children: blocks as IBatchBlock[]}
        const content = reduceTree(pseudoRoot, {startLevel: 0})
        const properties = PropertiesUtils.fromCamelCaseAll(top.properties)

        await insertBatchBlockBefore(top, {content, properties})
        for (const block of blocks)
            await logseq.Editor.removeBlock(block.uuid)
    }

    if (isSelectedState) {
        await sleep(20)
        await logseq.Editor.exitEditingMode()
    }
}

export function magicJoinCommand(independentMode: boolean) {
    const bulletPrefix = '* '
    const numberingPrefixGetters = [
        (n) => `${n}) `,
        (n) => `${numberToLetters(n)}) `,
        (n) => `${numberToRoman(n)}) `,
    ]

    return joinBlocksCommand(
        independentMode,
        (content, level, children, root) => {
            if (!root)
                throw new Error('assertion')

            let numbering = 1
            function resolvePrefix(content: string, block: BlockEntity) {
                const prefix = block._prefixGetter(numbering)

                if (block._isOrdered)
                    numbering++
                else  // start again on non-numbered child
                    numbering = 1

                const filler = ' '.repeat(prefix.length)
                return prefix + content.replaceAll(/\n^/gm, '\n' + filler)
            }

            if (level == 0)
                content = resolvePrefix(content, root)


            const divider = '\n'
            const dividerParagraph = '\n\n'

            if (content && children.length !== 0)
                content += (level < 1 ? dividerParagraph : divider)


            content += children.map((child, index) => {
                child = resolvePrefix(child, root.children![index] as BlockEntity)

                let chosenDivider = (level < 1 ? dividerParagraph : divider)
                if (level === 0) {
                    const childBlock = root.children![index] as BlockEntity
                    const prevChildBlock = root.children![index - 1] as BlockEntity
                    if (childBlock._isOrdered) {
                        // reduce divider for items in ordered list
                        chosenDivider = divider
                    }
                    else if (prevChildBlock && prevChildBlock._isOrdered) {
                        // increase upper divider for the last item in ordered list
                        child = divider + child
                    }
                }

                return child + chosenDivider
            }).join('').trimEnd()

            if (level === 1) {
                // Logseq markdown syntax require additional new line after block with children
                //     to display next block as a separate paragraph
                if (children.length !== 0)
                    content += '\n'
            }

            return content
        },
        (content, level, block, parent) => {
            const properties = block.properties ?? {}
            const isOrdered = properties[PropertiesUtils.numberingProperty] === 'number'

            // there shouldn't be a numbering after joining
            delete properties[PropertiesUtils.numberingProperty]

            if (isOrdered) {
                const type = (
                    (parent?._numberingType + 1) || 0
                ) % numberingPrefixGetters.length

                // don't save type for level 0 as the root item moves to the child level
                //    and they need the one level of numbering
                if (level !== 0)
                    block._numberingType = type

                block._isOrdered = true
                block._prefixGetter = numberingPrefixGetters[type]
            }
            else {
                if (level <= 1)
                    block._prefixGetter = (_) => ''
                else
                    block._prefixGetter = (_) => bulletPrefix
            }

            return content
        },
    )
}


export async function updateBlocksCommand(
    callback: (content: string, level: number, block: BlockEntity, parent?: BlockEntity) => string,
) {
    let [ blocks, isSelectedState ] = await getChosenBlocks()
    if (blocks.length === 0)
        return

    blocks = unique(blocks, (b) => b.uuid)
    blocks = await Promise.all(
        blocks.map(async (b) => {
            return (
                await logseq.Editor.getBlock(b.uuid, {includeChildren: true})
            )!
        })
    )
    blocks = filterOutChildBlocks(blocks)

    if (blocks.length === 0)
        return


    // it is important to check if any block in the tree has references
    // (Logseq replaces references with it's text)
    for (const block of blocks) {
        const blocksWithReferences = await getBlocksWithReferences(block)
        block._treeHasReferences = blocksWithReferences.length !== 0
    }


    for (const block of blocks) {
        // ensure .children always is array
        if (!block.children)
            block.children = []

        const newTree = walkBlockTree(block as WalkBlock, (b, level, p, data) => {
            const properties = PropertiesUtils.fromCamelCaseAll(data.node.properties)
            const propertiesOrder = PropertiesUtils.getPropertyNames(b.content)

            let content = PropertiesUtils.deleteAllProperties(b.content)
            content = callback(content, level, data.node, p as BlockEntity | undefined)

            for (const property of propertiesOrder)
                content += `\n${property}:: ${properties[property]}`

            return content
        })

        if (block._treeHasReferences || block.children.length === 0) {
            walkBlockTreeAsync(newTree, async (b, level) => {
                await logseq.Editor.updateBlock(b.data.node.uuid, b.content)
            })
        } else {
            await insertBatchBlockBefore(block, newTree)
            await logseq.Editor.removeBlock(block.uuid)
        }
    }

    if (isSelectedState) {
        await sleep(20)
        await logseq.Editor.exitEditingMode()
    }
}
