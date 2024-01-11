import { provideStyle, setNativeValue } from './utils'

import spareBlocksStyle from './css/spare_blocks.css?inline'


/**
 * Sublime Text-like double ⌘→ or ⌘← to move cursor to the end / start of the text area
 */
function improveCursorMovement_KeyDownListener(e: KeyboardEvent) {
    if (!e.target)
        return

    const target = e.target as HTMLInputElement
    if (target.tagName !== 'TEXTAREA')
        return

    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key))
        return


    const homeEvent = (
        (e.key === 'ArrowLeft' && e.metaKey && !e.altKey && !e.ctrlKey) ||
        (e.key === 'Home')
    )
    const endEvent = (
        (e.key === 'ArrowRight' && e.metaKey && !e.altKey && !e.ctrlKey) ||
        (e.key === 'End')
    )

    if (target.selectionEnd === 0 || target.selectionStart === target.value.length)
        return

    if (endEvent && target.value[target.selectionEnd as number] === '\n') {
        if (e.shiftKey)
            target.selectionEnd = -1
        else
            target.selectionStart = -1
    } else if (homeEvent && target.value[(target.selectionStart as number) - 1] === '\n')
        target.selectionStart = 0

    // @ts-expect-error
    target.scrollIntoViewIfNeeded()
}
export function improveCursorMovementFeature(toggle: boolean) {
    if (toggle)
        parent.document.addEventListener('keydown', improveCursorMovement_KeyDownListener)
    else
        parent.document.removeEventListener('keydown', improveCursorMovement_KeyDownListener)
}

/**
 * TAB-trigger and access current page name on Search
 */
async function improveSearch_KeyDownListener(e: KeyboardEvent) {
    if (!e.target)
        return

    const target = e.target as HTMLInputElement
    if (target.tagName !== 'INPUT' || target.id !== 'search')
        return

    if (!['ArrowLeft', 'Tab'].includes(e.key))
        return

    if ( !(
        !e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey
    ))
        return

    if (e.key === 'ArrowLeft') {
        if (!target.value) {
            e.preventDefault()
            const page = await logseq.Editor.getCurrentPage()
            if (page)
                setNativeValue(target, page.originalName, true)
        }
        return
    }

    e.preventDefault()

    const panel = target.closest('.cp__cmdk')!
    const active = panel.querySelector('.\\!opacity-100')
    if (!active)
        return

    // skip blocks results
    if (!active.parentElement!.classList.contains('search-results'))
        return

    const label = active!.querySelector('.text-sm.font-medium')!.childNodes[0] as HTMLElement

    let text: string = ''
    if (label.tagName === 'DIV') {  // page with alias
        const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT, null)!
        text = walker.nextNode()!.textContent!
    } else if (label.tagName === 'SPAN') {  // normal page, command, create command
        text = label.textContent!
    }

    if (e.key === 'Tab')
        if (target.value.toLowerCase() !== text.toLowerCase())
            setNativeValue(target, text, true)
}
export function improveSearchFeature(toggle: boolean) {
    if (toggle)
        parent.document.addEventListener('keydown', improveSearch_KeyDownListener, true)
    else
        parent.document.removeEventListener('keydown', improveSearch_KeyDownListener, true)
}

/**
 * CSS: Make spare space between 1-level blocks
 */
export function spareBlocksFeature(size: number) {
    const key = 'spare-blocks'
    if (size > 0)
        provideStyle(key, spareBlocksStyle.replace('${size}', size.toString()))
    else
        provideStyle(key)
}
