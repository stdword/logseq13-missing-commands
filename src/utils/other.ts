import { logseq as packageInfo } from '../../package.json'


export const isMacOS = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0
export const isWindows = navigator.userAgent.toUpperCase().indexOf('WIN') >= 0


/**
 * Tagged template printing function
 * @usage console.log(p`Hello, Logseq!`)
 * @usage console.debug(p``, {var})
 **/
export function p(strings: any, ...values: any[]): string {
    const raw = String.raw({raw: strings}, ...values)
    const space = raw ? ' ' : ''
    return `#${packageInfo.id}:${space}${raw}`
}

/**
 * Format-string
 * @usage f`Hello, ${'name'}!`({name: 'Logseq'})
 * @usage
 *     const format = f`Hello, ${'name'}!`
 *     format({name: 'Logseq'}) // => 'Hello, Logseq!'
 **/
export function f(strings: any, ...values: any[]): Function {
    return (format: {[i: string]: any}) => String.raw({raw: strings}, ...values.map(v => format[v]))
 }

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Count substrings in string
 */
export function countOf(string: string, substring: string): number {
    if (substring.length === 0)
        return 0

    const matchedCount = string.length - string.replaceAll(substring, '').length
    return matchedCount / substring.length
}

/**
 * Find index of Nth substring in string
 */
export function indexOfNth(string: string, substring: string, count: number = 1): number | null {
    if (count <= 0)
        throw new Error('count param should be positive')

    const realCount = countOf(string, substring)
    if (count > realCount)
        return null

    return string.split(substring, count).join(substring).length
}

/**
 * Remove duplicates
 */
export function unique<X>(items: Array<X>, keyFunction: (item: X) => any) {
    return items.filter((b, i, r) => {
        if (i === 0)
            return true
        return keyFunction(r[i - 1]) !== keyFunction(b)
    })
}


export function reduceTextWithLength(text: string, length: number, suffix = '...') {
    if (text.length <= length)
        return text
    return text.substring(0, length).trimEnd() + suffix
}

