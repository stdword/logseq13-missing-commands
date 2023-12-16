import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import {
    ICON, editNextBlockCommand, editPreviousBlockCommand, joinBlocksCommand, reverseBlocksCommand,
    shuffleBlocksCommand, sortBlocksCommand, splitBlocksCommand, splitByLines, splitByParagraphs, splitByWords, toggleAutoHeadingCommand
} from './commands'
import { getChosenBlocks, p, scrollToBlock } from './utils'


const DEV = process.env.NODE_ENV === 'development'

const settingsSchema: SettingSchemaDesc[] = [
    {
        key: 'splittingHeading',
        title: '⛓️ Split & Join',
        description: '',
        type: 'heading',
        default: null
    },
    {
        key: 'storeChildBlocksIn',
        title: 'Where to store nested blocks when splitting the block?',
        description: `
            <span style="display: flex; gap: 1rem; align-items: center;">
                <div>
                    <ul>
                        <li>First Last</li>
                        <ul>
                            <li>nested</li>
                        </ul>
                    </ul>
                    <p style="margin: 0px"> </p>
                </div>
                <div>→</div>
                <div>
                    <ul>
                        <li>First</li>
                        <ul>
                            <li>nested</li>
                        </ul>
                        <li>Last</li>
                    </ul>
                </div>
                <div>OR</div>
                <div>
                    <ul>
                        <li>First</li>
                        <li>Last</li>
                        <ul>
                            <li>nested</li>
                        </ul>
                    </ul>
                </div>
            </span>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['In the First block', 'In the Last block'],
        default: 'In the Last block',
    },
]
const settingsValues: any = settingsSchema.reduce((r, v) => ({ ...r, [v.key]: v}), {})


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

    logseq.useSettingsSchema(settingsSchema)

    console.info(p`Loaded`)
}

async function postInit() {
    await onAppSettingsChanged()
}

async function main() {
    await init()

    const settings = logseq.settings!

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
        label: ICON + ' Split by words', key: 'split-1-by-words',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByWords,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by words (with nested)', key: 'split-2-by-words-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByWords,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines', key: 'split-3-by-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByLines,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines (with nested)', key: 'split-4-by-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByLines,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Split by paragraphs', key: 'split-5-by-paragraphs',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByParagraphs,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by paragraphs (with nested)', key: 'split-6-by-paragraphs-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByParagraphs,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ))


    // Joining
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via spaces', key: 'join-1-spaces',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (root, level, children) => (root ? root + ' ' : '') + children.join(' '),
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join selected together via commas (with respect to root block)', key: 'join-2-commas',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (root, level, children) => {
            const prefix = root ? root + (level === 0 ? ': ' : ', ') : ''
            return prefix + children.join(', ')
        },
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join selected independently via commas (with respect to root block)', key: 'join-3-commas-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        true,
        (root, level, children) => {
            const prefix = root ? root + (level === 0 ? ': ' : ', ') : ''
            return prefix + children.join(', ')
        },
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines', key: 'join-4-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (root, level, children) => (root ? root + '\n' : '') + children.join('\n'),
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines (keep nested structure)', key: 'join-5-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (root, level, children) => (root ? root + '\n' : '') + children.join('\n'),
        (content, level) => {
            if (level <= 1)
                return content
            const prefix = '* '
            const shift = '\t'.repeat(level - 1)
            return shift + prefix + content.replaceAll(/\n^/gm, '\n' + shift + ' '.repeat(prefix.length))
        },
    ))


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
        label: ICON + ' Go to |↑| previous sibling block', key: 'edit-block-5-prev-sibling',
        keybinding: {mac: 'ctrl+shift+up', binding: 'meta+alt+up', mode: 'global'},
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
        label: ICON + ' Go to |↓| next sibling block', key: 'edit-block-6-next-sibling',
        keybinding: {mac: 'ctrl+shift+down', binding: 'meta+alt+down', mode: 'global'},
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
    }, async (e) => editPreviousBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↓) next block', key: 'edit-block-4-step-down',
        keybinding: {mac: 'mod+alt+down', binding: 'ctrl+alt+down', mode: 'global'},
    }, async (e) => editNextBlockCommand() )


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
        label: ICON + ' Outdent (⇤) children of the block', key: 'move-block-0-outdent-children',
        keybinding: {mac: 'ctrl+shift+tab', binding: 'ctrl+shift+tab', mode: 'global'},
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
