import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import {
    ICON, editNextBlockCommand, editPreviousBlockCommand, joinAsSentences_Map, joinBlocksCommand,
    joinViaCommas_Attach,
    joinViaNewLines_Attach,
    joinViaNewLines_Map,
    joinViaSpaces_Attach,
    lastChildBlockCommand, magicJoinCommand, magicSplit,
    moveToBottomOfSiblingsCommand,
    moveToTopOfSiblingsCommand,
    nextSiblingBlockCommand,
    outdentChildrenCommand,
    parentBlockCommand,
    previousSiblingBlockCommand,
    reverseBlocksCommand, shuffleBlocksCommand, sortBlocksCommand, splitBlocksCommand,
    splitByLines, splitBySentences, splitByWords, toggleAutoHeadingCommand,
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
const settings_: any = settingsSchema.reduce((r, v) => ({ ...r, [v.key]: v}), {})


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

    // logseq.useSettingsSchema(settingsSchema)

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

    function setting_storeChildBlocksIn() {
        return false
        // return settings.storeChildBlocksIn === settings_.storeChildBlocksIn.enumChoices[0]
    }

    // Decoration
    logseq.App.registerCommandPalette({
        label: ICON + ' Toggle auto heading', key: 'mc-1-auto-heading',
        keybinding: {mac: 'mod+1', binding: 'ctrl+1', mode: 'global'},
    }, (e) => toggleAutoHeadingCommand({togglingBasedOnFirstBlock: true}) )


    // Splitting
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by words', key: 'mc-5-split-1-by-words',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(splitByWords, setting_storeChildBlocksIn()))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by words (with nested)', key: 'mc-5-split-2-by-words-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(splitByWords, setting_storeChildBlocksIn(), true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines', key: 'mc-5-split-3-by-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(splitByLines, setting_storeChildBlocksIn()))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by lines (with nested)', key: 'mc-5-split-4-by-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitByLines, setting_storeChildBlocksIn(), true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Split', key: 'mc-5-split-5-magic',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(magicSplit, setting_storeChildBlocksIn(), false) )
    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Split (with nested)', key: 'mc-5-split-6-magic-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(magicSplit, setting_storeChildBlocksIn(), true) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Split by sentences', key: 'mc-5-split-7-by-sentences',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(splitBySentences, setting_storeChildBlocksIn()))
    logseq.App.registerCommandPalette({
        label: ICON + ' Split by sentences (with nested)', key: 'mc-5-split-8-by-sentences-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitBlocksCommand(
        splitBySentences, setting_storeChildBlocksIn(), true))


    // Joining
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via spaces', key: 'mc-6-join-1-spaces',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(false, joinViaSpaces_Attach))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join together via commas (with respect to root block)', key: 'mc-6-join-2-commas',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(false, joinViaCommas_Attach))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join independently via commas (with respect to root block)', key: 'mc-6-join-3-commas-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(true, joinViaCommas_Attach))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines', key: 'mc-6-join-4-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(false, joinViaNewLines_Attach))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join via new lines (keep nested structure)', key: 'mc-6-join-5-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(false, joinViaNewLines_Attach, joinViaNewLines_Map))

    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Join', key: 'mc-6-join-6-magic',
        // @ts-expect-error
        keybinding: {},
    }, (e) => magicJoinCommand(false))
    logseq.App.registerCommandPalette({
        label: ICON + ' Magic Join (independently)', key: 'mc-6-join-7-magic-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => magicJoinCommand(true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Join as sentences', key: 'mc-6-join-8-sentences',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(false, joinViaSpaces_Attach, joinAsSentences_Map, {shouldHandleSingleBlock: true}))
    logseq.App.registerCommandPalette({
        label: ICON + ' Join as sentences (independently)', key: 'mc-6-join-9-sentences-independently',
        // @ts-expect-error
        keybinding: {},
    }, (e) => joinBlocksCommand(true, joinViaSpaces_Attach, joinAsSentences_Map, {shouldHandleSingleBlock: true}))



    // Navigation
    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↖︎) parent block', key: 'mc-2-edit-block-1-deep-dive-out',
        keybinding: {mac: 'mod+alt+left', binding: 'ctrl+alt+left', mode: 'global'},
    }, async (e) => parentBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↘︎) last child block', key: 'mc-2-edit-block-2-deep-dive-in',
        keybinding: {mac: 'mod+alt+right', binding: 'ctrl+alt+right', mode: 'global'},
    }, async (e) => lastChildBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to |↑| previous sibling block', key: 'mc-2-edit-block-5-prev-sibling',
        keybinding: {mac: 'ctrl+shift+up', binding: 'meta+alt+up', mode: 'global'},
    }, async (e) => previousSiblingBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to |↓| next sibling block', key: 'mc-2-edit-block-6-next-sibling',
        keybinding: {mac: 'ctrl+shift+down', binding: 'meta+alt+down', mode: 'global'},
    }, async (e) => nextSiblingBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↑) previous block', key: 'mc-2-edit-block-3-step-up',
        keybinding: {mac: 'mod+alt+up', binding: 'ctrl+alt+up', mode: 'global'},
    }, async (e) => editPreviousBlockCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Go to (↓) next block', key: 'mc-2-edit-block-4-step-down',
        keybinding: {mac: 'mod+alt+down', binding: 'ctrl+alt+down', mode: 'global'},
    }, async (e) => editNextBlockCommand() )


    // Movements
    logseq.App.registerCommandPalette({
        label: ICON + ' Move block (⤒) on top of siblings', key: 'mc-3-move-block-1-on-top',
        keybinding: {mac: 'mod+alt+shift+up', binding: 'ctrl+alt+shift+up', mode: 'global'},
    }, async (e) => moveToTopOfSiblingsCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Move block (⤓) on bottom of siblings', key: 'mc-3-move-block-2-on-bottom',
        keybinding: {mac: 'mod+alt+shift+down', binding: 'ctrl+alt+shift+down', mode: 'global'},
    }, async (e) => moveToBottomOfSiblingsCommand() )

    logseq.App.registerCommandPalette({
        label: ICON + ' Outdent (⇤) children of the block', key: 'mc-3-move-block-3-outdent',
        keybinding: {mac: 'ctrl+shift+tab', binding: 'ctrl+shift+tab', mode: 'global'},
    }, async (e) => outdentChildrenCommand() )


    // Transformations
    logseq.App.registerCommandPalette({
        label: ICON + ' Sort blocks', key: 'mc-4-transform-1-sort-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => sortBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Sort blocks', async (e) => sortBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Reverse blocks', key: 'mc-4-transform-2-reverse-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => reverseBlocksCommand() )
    logseq.Editor.registerBlockContextMenuItem(
        ICON + ' Reverse blocks', async (e) => reverseBlocksCommand(e.uuid) )

    logseq.App.registerCommandPalette({
        label: ICON + ' Shuffle blocks', key: 'mc-4-transform-3-shuffle-blocks',
        // @ts-expect-error
        keybinding: {},
    }, (e) => shuffleBlocksCommand() )


    await postInit()
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
