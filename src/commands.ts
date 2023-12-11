import '@logseq/libs'

import { PropertiesUtils, getChosenBlocks, sleep } from './utils'
import { BlockEntity, IBatchBlock } from '@logseq/libs/dist/LSPlugin'


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
