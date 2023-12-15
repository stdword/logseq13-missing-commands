import '@logseq/libs'

import { PropertiesUtils, filterOutChildBlocks, getChosenBlocks, insertBatchBlockBefore, isWindows, sleep, transformSelectedBlocksCommand, unique, walkBlockTreeAsync } from './utils'
import { BlockEntity, IBatchBlock } from '@logseq/libs/dist/LSPlugin'


// there is no `saw` emoji in Windows — use `kitchen knife`: it has the same colors
export const ICON = isWindows ? '🔪' : '🪚'


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


// paragraphs → lines → sentences

export function splitByParagraphs(text: string): IBatchBlock[] {
    const textBlocks = text.split(/\n\n+/)
    return textBlocks.map((tb) => {return {content: tb}})
}

export function splitByLines(text: string): IBatchBlock[] {
    const textBlocks = text.split(/\n/)
    return textBlocks.map((tb) => {return {content: tb}})
}

export function splitByWords(text: string): IBatchBlock[] {
    const textBlocks = text.split(/[^\w-]+/)
    return textBlocks.filter((tb) => !!tb).map((tb) => {return {content: tb}})
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

            let head, tail
            if (keepChildrenInFirstBlock)
                [head, tail] = [batch[0], batch.slice(1)]
            else
                [tail, head] = [batch.slice(0, -1), batch.at(-1)!]

            if (content !== head.content)  // has changes?
                await logseq.Editor.updateBlock(
                    block.uuid, head.content, {properties: block.properties})

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

// export async function magicSplitCommand() {
//     const [ blocks, isSelectedState ] = await getChosenBlocks()
//     if (blocks.length === 0) {
//         await logseq.UI.showMsg(
//             `[:div
//                 [:b "Magic Split Command"]
//                 [:p "Select some blocks or start editing one to use the command"]]`,
//             'warning',
//             {timeout: 10000},
//         )
//         return
//     }

//     function repeatedCharsWithSpaces(chars) {
//         chars = chars.replaceAll('[', '\\[')
//         chars = chars.replaceAll(']', '\\]')
//         chars = chars.replaceAll('-', '\\-')
//         const spaces = '  ' // with &nbsp;
//         return '[' + spaces + chars + ']*'
//     }

//     for (const block of blocks) {
//         const lines = block.content.split(/\n/gm)

//         var trimStart = null
//         if (c.args['trim-numbering'])
//             trimStart = /^\s*\d+\s*\.\s*/
//         else if (c.args['trim-start'])
//             trimStart = trimStart = new RegExp('^' + repeatedCharsWithSpaces(c.args['trim-start']))

//         var trimEnd = new RegExp(repeatedCharsWithSpaces(c.args['trim-end']) + '$')

//         lines.forEach((line, i) => {
//             if (trimStart)
//                 line = line.replace(trimStart, '')
//             if (trimEnd)
//                 line = line.replace(trimEnd, '')

//             if (i === 0 && line === '')
//                 return

//             top.logseq.api.insert_block(c.block.uuid, line, {focus: false, sibling: true})
//         })
//     }
// }
