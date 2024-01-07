import { provideStyle } from './utils'

import tabularViewStyle from './css/tabular_view.css?inline'
import boxViewStyle from './css/box_view.css?inline'
import columnsViewStyle from './css/columns_view.css?inline'
import galleryViewStyle from './css/gallery_view.css?inline'

import hideDotRefs_WrapStyle from './css/hide_dot_refs__wrap.css?inline'
import hideDotRefs_HoverStyle from './css/hide_dot_refs__hover.css?inline'


/**
 * CSS: Hide references started with «.»
 */
export function hideDotRefs(wrapToDots: boolean, hideWhenNotHovered?: boolean) {
    const key = 'dot-refs'
    if (!wrapToDots)
        provideStyle(key)
    else if (hideWhenNotHovered)
        provideStyle(key, hideDotRefs_WrapStyle + '\n' + hideDotRefs_HoverStyle)
    else
        provideStyle(key, hideDotRefs_WrapStyle)
}

/**
 * CSS: Tabular view
 */
export function tabularView(toggle: boolean) {
    const key = 'tabular-view'
    if (toggle)
        provideStyle(key, tabularViewStyle)
    else
        provideStyle(key)
}

/**
 * CSS: Box view
 */
export function boxView(toggle: boolean) {
    const key = 'box-view'
    if (toggle)
        provideStyle(key, boxViewStyle)
    else
        provideStyle(key)
}

/**
 * CSS: Columns view
 */
export function columnsView(toggle: boolean) {
    const key = 'columns-view'
    if (toggle)
        provideStyle(key, columnsViewStyle)
    else
        provideStyle(key)
}

/**
 * CSS: Gallery view
 */
export function galleryView(toggle: boolean) {
    const key = 'gallery-view'
    if (toggle)
        provideStyle(key, galleryViewStyle)
    else
        provideStyle(key)
}
