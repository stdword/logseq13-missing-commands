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

export function escapeForRegExp(str: string) {
    const specials = [
        '^', '$',
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\',
    ]

    const replacer = new RegExp('(\\' + specials.join('|\\') + ')', 'g')
    return str.replaceAll(replacer, '\\$1')
}


/**
 * source: https://stackoverflow.com/a/75643566
 */
export function numberToLetters(x: number) {
    if (x <= 0)
        return ''
    const letters = numberToLetters(Math.floor((x - 1) / 26)) + String.fromCharCode((x - 1) % 26 + 65)
    return letters.toLowerCase()
}
export function lettersToNumber(letters: string) {
    return letters.toLowerCase().split('').reduce((acc, val) => acc * 26 + val.charCodeAt(0) - 64, 0)
}

/**
 * source: https://stackoverflow.com/a/70844631
 */
const romanValues = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100,  XC: 90,  L: 50,  XL: 40,
    X: 10,   IX: 9,   V: 5,   IV: 4,
    I: 1,
}
export function numberToRoman(x: number = 0) {
    return Object.keys(romanValues).reduce((acc, key) => {
        while (x >= romanValues[key]) {
            acc += key
            x -= romanValues[key]
        }
        return acc
    }, '')
}
export function fromRoman(letters: string = '') {
    return Object.keys(romanValues).reduce((acc, key) => {
        while (letters.indexOf(key) === 0) {
            acc += romanValues[key];
            letters = letters.substr(key.length);
        }
        return acc;
    }, 0);
}
