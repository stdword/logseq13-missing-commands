import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import {
    ICON, editNextBlockCommand, editPreviousBlockCommand, joinBlocksCommand, magicJoinCommand, magicSplit,
    reverseBlocksCommand, shuffleBlocksCommand, sortBlocksCommand, splitBlocksCommand,
    splitByLines, splitByWords, toggleAutoHeadingCommand,
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
        label: ICON + ' Toggle auto heading', key: '1-auto-heading',
        keybinding: {mac: 'mod+1', binding: 'ctrl+1', mode: 'global'},
    }, (e) => toggleAutoHeadingCommand({togglingBasedOnFirstBlock: true}) )


    // Splitting
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by words', key: '5-split-1-by-words',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByWords,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by words (with nested)', key: '5-split-2-by-words-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByWords,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines', key: '5-split-3-by-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByLines,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines (with nested)', key: '5-split-4-by-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByLines,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Split', key: '5-split-5-magic',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        magicSplit,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        false,
    ) )
    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Split (with nested)', key: '5-split-6-magic-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        magicSplit,
        settings.storeChildBlocksIn === settingsValues.storeChildBlocksIn.enumChoices[0],
        true,
    ) )


    // Joining
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via spaces', key: '6-join-1-spaces',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (content, level, children) => (content ? content + ' ' : '') + children.join(' '),
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join selected together via commas (with respect to root block)', key: '6-join-2-commas',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (content, level, children) => {
            const prefix = content ? content + (level === 0 ? ': ' : ', ') : ''
            return prefix + children.join(', ')
        },
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join selected independently via commas (with respect to root block)', key: '6-join-3-commas-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        true,
        (content, level, children) => {
            const prefix = content ? content + (level === 0 ? ': ' : ', ') : ''
            return prefix + children.join(', ')
        },
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines', key: '6-join-4-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (content, level, children) => (content ? content + '\n' : '') + children.join('\n'),
    ))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines (keep nested structure)', key: '6-join-5-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(
        false,
        (content, level, children) => (content ? content + '\n' : '') + children.join('\n'),
        (content, level) => {
            if (level <= 1)
                return content
            const prefix = '* '
            const shift = '  '.repeat(level - 1)
            return shift + prefix + content.replaceAll(/\n^/gm, '\n' + shift + ' '.repeat(prefix.length))
        },
    ))

    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Join selected together', key: '6-join-6-magic',
        // @ts-expect-error
        keybinding: {},
    }, (e) => magicJoinCommand(false))
    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Join selected independently', key: '6-join-7-magic-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => magicJoinCommand(true))


    // Navigation
    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↖︎) parent block', key: '2-edit-block-1-deep-dive-out',
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
        label: ICON + ' Go to (↘︎) last child block', key: '2-edit-block-2-deep-dive-in',
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
        label: ICON + ' Go to |↑| previous sibling block', key: '2-edit-block-5-prev-sibling',
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
        label: ICON + ' Go to |↓| next sibling block', key: '2-edit-block-6-next-sibling',
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
        label: ICON + ' Go to (↑) previous block', key: '2-edit-block-3-step-up',
        keybinding: {mac: 'mod+alt+up', binding: 'ctrl+alt+up', mode: 'global'},
    }, async (e) => editPreviousBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↓) next block', key: '2-edit-block-4-step-down',
        keybinding: {mac: 'mod+alt+down', binding: 'ctrl+alt+down', mode: 'global'},
    }, async (e) => editNextBlockCommand() )


    // Movements
    logseq.App.registerCommandPalette({
        label: ICON + ' Move block (⤒) on top of siblings', key: '3-move-block-1-on-top',
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
        label: ICON + ' Move block (⤓) on bottom of siblings', key: '3-move-block-2-on-bottom',
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
        label: ICON + ' Outdent (⇤) children of the block', key: '3-move-block-0-outdent-children',
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
        label: ICON + ' Sort blocks', key: '4-transform-1-sort-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => sortBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Sort blocks', async (e) => sortBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Reverse blocks', key: '4-transform-2-reverse-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => reverseBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Reverse blocks', async (e) => reverseBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Shuffle blocks', key: '4-transform-3-shuffle-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => shuffleBlocksCommand() )

    await postInit()
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
