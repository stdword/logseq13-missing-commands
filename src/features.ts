import { PropertiesUtils, escapeForRegExp, provideStyle, setNativeValue } from './utils'

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
 * Edit block on mouse click to reference with ALT/OPT pressed
 */
async function improveMouseRefClick_MouseUpListener(e: MouseEvent) {
    if (!e.target)
        return

    if (! (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey))
        return

    let target = e.target as HTMLElement
    if (target.classList.contains('awLi-icon'))  // Awesome Links: icon element
        target = target.parentElement!
    if (target.classList.contains('shml-anchor'))  // Shorten My Links: anchor element
        target = target.parentElement!
    if (target.tagName !== 'A')
        return

    const isTag = target.classList.contains('tag')
    if (!target.classList.contains('page-ref') && !isTag)
        return

    const block = target.closest('.block-content') as HTMLElement
    // @ts-expect-error
    const uuid = block.attributes.blockid.value
    if (!uuid)
        return

    e.stopPropagation()

    // get block content
    let content = (await logseq.Editor.getBlock(uuid))!.content
    content = PropertiesUtils.deletePropertyFromString(content, 'id')
    //

    // get ref text and its width per char
    const textNode = target.childNodes[target.childNodes.length - 1]
    let text = textNode.textContent ?? ''

    const rect = target.getBoundingClientRect()
    let textWidth = rect.width
    for (const child of target.childNodes) {
        const e = child as HTMLElement
        if (child.nodeType !== document.TEXT_NODE) {
            textWidth -= e.getBoundingClientRect().width
            if (e.classList.contains('awLi-icon'))
                textWidth -= 5  // additional margin for icon
        }
    }

    const widthPerChar = textWidth / (text.length || 1)
    if (isTag)
        text = text.slice(1)
    //

    // find ref position in block
    const escapedText = escapeForRegExp(text)
    const refText = `\\[\\[${escapedText}\\]\\]`

    let startRefPos = -1
    if (isTag) {
        startRefPos = content.search(new RegExp(`#${escapedText}`, 'u'))

        if (startRefPos === -1) {
            startRefPos = content.search(new RegExp(`#${refText}`, 'u'))
            if (startRefPos !== -1)
                startRefPos += 2  // for [[
        }

        if (startRefPos !== -1)
            startRefPos += 1  // for #
    } else {
        startRefPos = content.search(new RegExp(refText, 'u'))
        if (startRefPos !== -1)
            startRefPos += 2  // for [[
    }

    if (startRefPos === -1) {
        // Shorten My Links plugin integration
        const shortenRefText = `/${escapedText}\\]\\]`
        startRefPos = content.search(new RegExp(shortenRefText, 'u'))
        if (startRefPos !== -1)
            startRefPos += 1  // for /
    }

    if (startRefPos === -1)
        startRefPos = 0
    //

    // find relative click position
    const relativeToEndPos = rect.right - e.x
    const charPosRight = Math.round(relativeToEndPos / widthPerChar)
    const charsOffset = Math.max(0, text.length - charPosRight)
    //

    await logseq.Editor.editBlock(uuid, {pos: startRefPos + charsOffset})
}
export function improveMouseRefClick(toggle: boolean) {
    if (toggle)
        parent.document.addEventListener('mouseup', improveMouseRefClick_MouseUpListener, true)
    else
        parent.document.removeEventListener('mouseup', improveMouseRefClick_MouseUpListener, true)
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
