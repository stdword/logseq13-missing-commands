import { BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

import {
    ICON,

    toggleAutoHeadingCommand,
    outdentChildrenCommand,
    editNextBlockCommand, editPreviousBlockCommand,
    parentBlockCommand, lastChildBlockCommand,
    moveToBottomOfSiblingsCommand, moveToTopOfSiblingsCommand,
    nextSiblingBlockCommand, previousSiblingBlockCommand,
    reverseBlocksCommand, shuffleBlocksCommand, sortBlocksCommand,

    joinBlocksCommand, splitBlocksCommand, updateBlocksCommand,

    magicJoinCommand, magicSplit,
    joinAsSentences_Map, joinViaCommas_Attach, joinViaSpaces_Attach,
    joinViaNewLines_Attach, joinViaNewLines_Map,

    splitByLines, splitBySentences, splitByWords,
    removeNewLines, removeHTML, parseYoutubeTimestamp,
    lowerCase, upperCase, titleCaseWords, titleCaseSentences,
} from './commands'
import { improveCursorMovementFeature, improveSearchFeature, spareBlocksFeature } from './features'
import { borderView, columnsView, galleryView, hideDotRefs, tabularView } from './views'
import { getChosenBlocks, p, scrollToBlock } from './utils'


const DEV = process.env.NODE_ENV === 'development'

const defaultSpareBlocksSpace = 20

const settingsSchema: SettingSchemaDesc[] = [
    {
        key: 'headingCommands',
        type: 'heading',
        title: '🔧 Commands',
        description: `
            <p>See detailed description about every command in
                <a href="https://github.com/stdword/logseq13-missing-commands#readme">
                documentation</a>.
            </p><br/>
            <p><i>To change shortcut for the particular command:</i></p>
            <p><ol>
                <li>Open «Settings» → «Keymap».</li>
                <li>Copy this emoji «🪚» (for Windows use «🔪») and insert it to search input.</li>
                <li>Change any shortcut you want</li>
            </ol></p>
        `.trim(),
        default: null,
    },
    {
        key: 'headingFeatures',
        type: 'heading',
        title: '⛓️ Features',
        description: `
            <p>See detailed description about every feature in
                <a href="https://github.com/stdword/logseq13-missing-commands?tab=readme-ov-file#1-features">
                documentation</a>.
            </p>
        `.trim(),
        default: null,
    },
    {
        key: 'enableHomeEnd',
        title: 'Enable improved «Home» / «End» keys processing?',
        description: `
            <p>1. Double-press the <code>Home</code> / <code>End</code> key (in edit mode) to go to the block start / end.</p>
            <p>2. MacOS's <code>⌘ ←</code> / <code>⌘ →</code> and Windows's <code>fn ←</code> / <code>fn →</code> are also supported.</p>
            <p><i>Restriction</i>: This feature only works for natural lines of block, which have a «new line» character («\\n»). It does not work with lines created due to the size of the layout. In such cases, the only way to proceed is to press <code>Esc</code> to exit edit mode and then use the <code>←</code> or <code>→</code> arrow key to re-enter it.</p>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
    {
        key: 'enableSearchImprovements',
        title: 'Enable improved keys processing on Search?',
        description: `
            <p>1. Press <code>Tab</code> to fill the input with selected search item.</p>
            <p>2. Press <code>←</code> arrow (with empty input) to fill the input with the current page name.</p>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
    {
        key: 'spareBlocksSpace',
        title: 'Spare space between 1-level blocks',
        description: `
            <p>Increase the space to clearly separate blocks from each other.</p>
            <p><i>Motivation</i>: blocks on the 1-level represent the most general parts of the information, which usually stand separately: headings, categories, clients, code snippets, links, etc.</p>
            <p><i>In pixels</i>: default is <code>${defaultSpareBlocksSpace}</code>. Set to <code>0</code> to disable.</p>
        `.trim(),
        type: 'number',
        default: defaultSpareBlocksSpace,
    },
    {
        key: 'headingViews',
        type: 'heading',
        title: '🔭 Views',
        description: `
            <p>See detailed description about every view in
                <a href="https://github.com/stdword/logseq13-missing-commands?tab=readme-ov-file#7-views">
                documentation</a>.
            </p>
        `.trim(),
        default: null,
    },
    {
        key: 'hideDotRefs',
        title: 'Hide references started with «.»?',
        description: `
            <p>Hide any page and tag references that start with the dot: «.», assuming that these are special reserved references that do not need to be shown.</p>
        `.trim(),
        type: 'enum',
        enumPicker: 'select',
        enumChoices: ['Hide completely and show on block hover', 'Hide by wrapping to «…» only', 'No'],
        default: 'Hide by wrapping to «…» only',
    },
    {
        key: 'enableTabularView',
        title: 'Enable tabular view?',
        description: `
            <ol>
            <li>Use the <code>#.tabular</code> reference in a block to apply a Tana-like tabular view for all its children.
                It could be subsequent: <code>#.tabular</code> inside another <code>#.tabular</code>. However, only <ins>two</ins> subsequent levels are supported.</li>
            <li>Use the <code>#.tabular0</code> reference in <ins>another tabular row</ins> to skip the immediate children.</li>
            </ol>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
    {
        key: 'enableColumnsView',
        title: 'Enable columns view?',
        description: `
            <ol>
                <li>Use the <code>#.columns</code> reference to organize child blocks
                    to columns of <ins>the same</ins> width.
                    1 column = 1 block.</li>
                <li>Use the <code>#.columns-N</code> reference to organize child blocks
                    to N columns of <ins>the same</ins> width, where N = 2…6.
                    1 column = 1 or more blocks.</li>
                <li>Use the <code>#.columns-fit</code> reference to organize child blocks
                    to columns with <ins>different</ins> width (based on content).
                    1 column = 1 block.</li>
            </ol>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
    {
        key: 'enableGalleryView',
        title: 'Enable gallery view?',
        description: `
            <ol>
                <li>Use the <code>#.gallery</code> reference to organize child blocks containing images to gallery.
                    Image sizes automatically fills whole space for width. There is only <ins>one row</ins> of images.</li>
                <li>Use the <code>#.gallery-wN</code> reference to organize child blocks containing images as fixed-width (based on N) images.
                    There can be <ins>multiple rows</ins> of images.</li>
                <li>Use the <code>#.gallery-hN</code> reference to organize child blocks containing images as fixed-height (based on N) images.
                    There can be <ins>multiple rows</ins> of images.</li>
            </ol>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
    {
        key: 'enableBorderView',
        title: 'Enable border view?',
        description: `
            <p>Use the <code>#.border</code> & <code>#.border-child</code> references to organize borders around the blocks.<br/>
               These references can be combined.</p>
        `.trim(),
        type: 'enum',
        enumPicker: 'radio',
        enumChoices: ['Yes', 'No'],
        default: 'Yes',
    },
]
const settings_: any = settingsSchema.reduce((r, v) => ({ ...r, [v.key]: v}), {})


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
async function postInit(settings) {
    await onAppSettingsChanged(settings, undefined)
}
async function onAppSettingsChanged(current, old) {
    if (!old || current.enableHomeEnd !== old.enableHomeEnd) {
        improveCursorMovementFeature(false)
        if (current.enableHomeEnd === 'Yes')
            improveCursorMovementFeature(true)
    }

    if (!old || current.enableSearchImprovements !== old.enableSearchImprovements) {
        improveSearchFeature(false)
        if (current.enableSearchImprovements === 'Yes')
            improveSearchFeature(true)
    }

    if (!old || current.spareBlocksSpace !== old.spareBlocksSpace)
        spareBlocksFeature(current.spareBlocksSpace)

    if (!old || current.hideDotRefs !== old.hideDotRefs)
        if (current.hideDotRefs === 'No')
            hideDotRefs(false)
        else if (current.hideDotRefs === settings_.hideDotRefs.default)
            hideDotRefs(true, false)  // wrap only
        else
            hideDotRefs(true, true)   // wrap & hide

    if (!old || current.enableTabularView !== old.enableTabularView)
        tabularView(current.enableTabularView === 'Yes')

    if (!old || current.enableColumnsView !== old.enableColumnsView)
        columnsView(current.enableColumnsView === 'Yes')

    if (!old || current.enableGalleryView !== old.enableGalleryView)
        galleryView(current.enableGalleryView === 'Yes')

    if (!old || current.enableBorderView !== old.enableBorderView)
        borderView(current.enableBorderView === 'Yes')
}


async function main() {
    await init()

    const settings = logseq.settings!
    const settingsOff = logseq.onSettingsChanged(onAppSettingsChanged)

    logseq.beforeunload(async () => {
        improveCursorMovementFeature(false)
        improveSearchFeature(false)
        settingsOff()
    })


    function setting_storeChildBlocksIn() {
        return false  // the last one
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


    // Updates
    logseq.App.registerCommandPalette({
        label: ICON + ' Remove new lines', key: 'mc-7-update-1-remove-new-lines',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(removeNewLines))
    logseq.App.registerCommandPalette({
        label: ICON + ' Remove new lines (with nested)', key: 'mc-7-update-2-remove-new-lines-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(removeNewLines, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Lower case', key: 'mc-7-update-3-lower-case',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(lowerCase))
    logseq.App.registerCommandPalette({
        label: ICON + ' Lower case (with nested)', key: 'mc-7-update-4-lower-case-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(lowerCase, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Upper case', key: 'mc-7-update-5-upper-case',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(upperCase))
    logseq.App.registerCommandPalette({
        label: ICON + ' Upper case (with nested)', key: 'mc-7-update-6-upper-case-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(upperCase, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Title case words', key: 'mc-7-update-7-title-case-words',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(titleCaseWords))
    logseq.App.registerCommandPalette({
        label: ICON + ' Title case words (with nested)', key: 'mc-7-update-8-title-case-words-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(titleCaseWords, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Title case sentences', key: 'mc-7-update-9-title-case-sentences',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(titleCaseSentences))
    logseq.App.registerCommandPalette({
        label: ICON + ' Title case sentences (with nested)', key: 'mc-7-update-10-title-case-sentences-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(titleCaseSentences, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Remove HTML', key: 'mc-7-update-11-remove-html',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(removeHTML))
    logseq.App.registerCommandPalette({
        label: ICON + ' Remove HTML (with nested)', key: 'mc-7-update-12-remove-html-nested',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(removeHTML, true))

    logseq.App.registerCommandPalette({
        label: ICON + ' Parse YouTube timestamps (with nested)', key: 'mc-7-update-13-parse-yt-ts',
        // @ts-expect-error
        keybinding: {},
    }, (e) => updateBlocksCommand(parseYoutubeTimestamp, true))


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


    await postInit(settings)
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
