import { provideStyle } from './utils'

import tabularViewStyle from './css/tabular_view.css?inline'


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
