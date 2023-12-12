import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { ICON, reverseBlocksCommand, shuffleBlocksCommand, sortBlocksCommand, splitByParagraphsCommand, toggleAutoHeadingCommand } from './commands'
import { getChosenBlocks, p, scrollToBlock } from './utils'


const DEV = process.env.NODE_ENV === 'development'


async function onAppSettingsChanged() {
}

async function init() {
    if (DEV) {
        logseq.UI.showMsg(
            `[:div [:b "Missing Commands"] [:p "HMR"] ]`,
            'info',
            {timeout: 3000},
        )
    }

    console.info(p`Loaded`)
}

async function postInit() {
    await onAppSettingsChanged()
}

async function main() {
    await init()

    logseq.onSettingsChanged(async (old, new_) => {
        await onAppSettingsChanged()
    })

    // Decoration
    logseq.App.registerCommandPalette({
        label: ICON + ' Toggle auto heading', key: 'auto-heading',
        keybinding: {mac: 'mod+1', binding: 'ctrl+1', mode: 'global'},
    }, (e) => toggleAutoHeadingCommand({togglingBasedOnFirstBlock: true}) )


    // Splitting
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by paragraphs', key: 'split-by-paragraphs',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitByParagraphsCommand() )


    // Navigation
    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↖︎) parent block', key: 'edit-block-1-deep-dive-out',
        keybinding: {mac: 'mod+alt+left', binding: 'ctrl+alt+left', mode: 'global'},
    }, async (e) => {
        const [blocks] = await getChosenBlocks()
        const [first] = blocks
        if (!first)
            return

        if (first.parent.id === first.page.id)
            return

        const parentBlock = await logseq.Editor.getBlock(first.parent.id) as BlockEntity
        await logseq.Editor.editBlock(parentBlock.uuid)
    } )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↘︎) last child block', key: 'edit-block-2-deep-dive-in',
        keybinding: {mac: 'mod+alt+right', binding: 'ctrl+alt+right', mode: 'global'},
    }, async (e) => {
        const [blocks] = await getChosenBlocks()
        const [first] = blocks
        if (!first)
            return

        const tree = await logseq.Editor.getBlock(first.uuid, {includeChildren: true}) as BlockEntity
        if (!tree.children || tree.children.length === 0)
            return

        const lastChild = tree.children!.at(-1)! as BlockEntity
        await logseq.Editor.editBlock(lastChild.uuid)
    } )

    logseq.App.registerCommandPalette({
        keybinding: {mac: 'ctrl+shift+up', binding: 'ctrl+shift+up', mode: 'global'},
        label: ICON + ' Go to |↑| previous sibling block', key: 'edit-block-5-prev-sibling',
    }, async (e) => {
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
    } )

    logseq.App.registerCommandPalette({
        keybinding: {mac: 'ctrl+shift+down', binding: 'ctrl+shift+down', mode: 'global'},
        label: ICON + ' Go to |↓| next sibling block', key: 'edit-block-6-next-sibling',
    }, async (e) => {
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
    } )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↑) previous block', key: 'edit-block-3-step-up',
        keybinding: {mac: 'mod+alt+up', binding: 'ctrl+alt+up', mode: 'global'},
    }, async (e) => {
        const [blocks] = await getChosenBlocks()
        let [current] = blocks
        if (!current)
            return

        await logseq.Editor.exitEditingMode()

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

        await logseq.Editor.editBlock((prevBlock as BlockEntity).uuid)
    } )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↓) next block', key: 'edit-block-4-step-down',
        keybinding: {mac: 'mod+alt+down', binding: 'ctrl+alt+down', mode: 'global'},
    }, async (e) => {
        const [blocks] = await getChosenBlocks()
        let [current] = blocks
        if (!current)
            return

        await logseq.Editor.exitEditingMode()

        let nextBlock: BlockEntity | null = null
        if (!current['collapsed?']) {
            const tree = await logseq.Editor.getBlock(current.uuid, {includeChildren: true}) as BlockEntity
            if (tree.children && tree.children.length !== 0)
                nextBlock = tree.children[0] as BlockEntity
        }

        if (!nextBlock)
            while (true) {
                if (!nextBlock) {
                    nextBlock = await logseq.Editor.getNextSiblingBlock(current.uuid)
                    if (nextBlock)
                        break
                }

                if (current.parent.id === current.page.id)
                    break

                const parent = await logseq.Editor.getBlock(current.parent.id) as BlockEntity
                current = parent

                nextBlock = await logseq.Editor.getNextSiblingBlock(parent.uuid)
                if (nextBlock)
                    break
            }

        if (!nextBlock) {
            // no next block at all → go to the end of current
            await logseq.Editor.editBlock(current.uuid)
            return
        }

        await logseq.Editor.editBlock((nextBlock as BlockEntity).uuid, {pos: 0})
    } )


    // Movements
    logseq.App.registerCommandPalette({
        label: ICON + ' Move block (⤒) on top of siblings', key: 'move-block-1-on-top',
        keybinding: {mac: 'mod+alt+shift+up', binding: 'ctrl+alt+shift+up', mode: 'global'},
    }, async (e) => {
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
    } )

    logseq.App.registerCommandPalette({
        label: ICON + ' Move block (⤓) on bottom of siblings', key: 'move-block-2-on-bottom',
        keybinding: {mac: 'mod+alt+shift+down', binding: 'ctrl+alt+shift+down', mode: 'global'},
    }, async (e) => {
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
    } )

    logseq.App.registerCommandPalette({
        keybinding: {mac: 'mod+alt+tab', binding: 'ctrl+alt+tab', mode: 'global'},
        label: ICON + ' Outdent (⇤) children of the block', key: 'move-block-0-outdent-children',
    }, async (e) => {
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
    } )


    // Transformations
    logseq.App.registerCommandPalette({
        label: ICON + ' Sort blocks', key: 'transform-1-sort-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => sortBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Sort blocks', async (e) => sortBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Reverse blocks', key: 'transform-2-reverse-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => reverseBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Reverse blocks', async (e) => reverseBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Shuffle blocks', key: 'transform-3-shuffle-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => shuffleBlocksCommand() )

    await postInit()
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
