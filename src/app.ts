import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import { splitByParagraphsCommand, toggleAutoHeadingCommand } from './commands'
import { getChosenBlocks, p } from './utils'
import { log } from 'console'


const DEV = process.env.NODE_ENV === 'development'


async function onAppSettingsChanged() {
    //
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

    logseq.App.registerCommandPalette({
        label: '🪚 Toggle auto heading', key: 'auto-heading',
        keybinding: {mac: 'mod+1', binding: 'ctrl+1', mode: 'global'},
    }, (e) => toggleAutoHeadingCommand({togglingBasedOnFirstBlock: true}) )

    logseq.App.registerCommandPalette({
        label: '🪚 Split by paragraphs', key: 'split-by-paragraphs',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitByParagraphsCommand() )


    // Navigation
    logseq.App.registerCommandPalette({
        label: '🪚 Go to (↖︎) parent block', key: 'edit-block-1-deep-dive-out',
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
        label: '🪚 Go to (↘︎) last child block', key: 'edit-block-2-deep-dive-in',
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
        label: '🪚 Go to |↑| previous sibling block', key: 'edit-block-5-prev-sibling',
        keybinding: {mac: 'ctrl+shift+up', binding: 'ctrl+shift+up', mode: 'global'},
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
        label: '🪚 Go to |↓| next sibling block', key: 'edit-block-6-next-sibling',
        keybinding: {mac: 'ctrl+shift+down', binding: 'ctrl+shift+down', mode: 'global'},
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
        label: '🪚 Go to (↑) previous block', key: 'edit-block-3-step-up',
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
        label: '🪚 Go to (↓) next block', key: 'edit-block-4-step-down',
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

    await postInit()
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
