export function lcfirst (str: string = '') {
    return str.slice(0, 1).toLowerCase() + str.slice(1)
}

export function ucfirst (str: string = '') {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}