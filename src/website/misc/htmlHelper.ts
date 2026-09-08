/**
 * 
 * @param constantString NEEDS to be a constant string, this is done to prevent XSS
 * @returns 
 */
export function createElementFromHTML<T extends string>(constantString: T & (string extends T ? never : unknown)) {
    const template = document.createElement('template')
    template.innerHTML = constantString.trim()
    return template.content.firstElementChild!
}