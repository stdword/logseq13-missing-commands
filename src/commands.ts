import '@logseq/libs'

import { PropertiesUtils, getChosenBlocks, isWindows, sleep, transformSelectedBlocksCommand } from './utils'
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


// paragraphs → lines → sentences

function splitByParagraphs(text: string): IBatchBlock[] {
    const textBlocks = text.split(/\n\n+/)
    return textBlocks.map((tb) => {return {content: tb}})
}

export async function splitByParagraphsCommand() {
    const [ blocks, isSelectedState ] = await getChosenBlocks()
    if (blocks.length === 0)
        return

    for (const block of blocks) {
        const content = PropertiesUtils.deleteAllProperties(block.content)
        const batch = splitByParagraphs(content)

        await logseq.Editor.insertBatchBlock(block.uuid, batch.slice(1), {before: false, sibling: true})
        await logseq.Editor.updateBlock(block.uuid, batch[0].content, {properties: block.properties})
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
