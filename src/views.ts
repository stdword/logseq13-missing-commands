import { provideStyle } from './utils'

import tabularViewStyle from './css/tabular_view.css?inline'
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
