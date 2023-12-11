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
        label: '🪚 Toggle auto heading', key: 'toggle-auto-heading',
        keybinding: {mac: 'mod+1', binding: 'ctrl+1', mode: 'global'},
    }, (e) => toggleAutoHeadingCommand({togglingBasedOnFirstBlock: true}) )

    logseq.App.registerCommandPalette({
        label: '🪚 Split by paragraphs', key: 'split-by-paragraphs',
        // @ts-expect-error
        keybinding: {},
    }, (e) => splitByParagraphsCommand() )
    await postInit()
}


export const App = (logseq: any) => {
    logseq.ready(main).catch(console.error)
}
