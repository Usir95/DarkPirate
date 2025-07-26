// utils/InputUtils.js

export function RestrictInput(value = '', type = 'none') {
    switch (type) {
        case 'letters':
            return value.replace(/[^a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s\-]/g, '')
        case 'numbers':
            return value.replace(/[^0-9]/g, '')
        case 'decimal':
            return value
                .replace(/[^0-9.]/g, '')           // solo dígitos y puntos
                .replace(/(\..*)\./g, '$1')        // no más de un punto
        case 'currency':
            return value.replace(/[^0-9.,]/g, '')  // permites , o .
        case 'alphanumeric':
            return value.replace(/[^a-zA-Z0-9ÁÉÍÓÚÜÑáéíóúüñ\s\-_.,;]/g, '')
        default:
            return value // sin restricción
    }
}

export function IsValidKeyStroke(event, type = 'none') {
    const key = event.key

    // Navegación básica permitida
    const navigationKeys = [
        'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Delete', 'Home', 'End'
    ]
    if (navigationKeys.includes(key)) return true

    // Combinaciones de edición permitidas: Ctrl/Cmd + A, C, V, X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
        return true
    }

    const testMap = {
        letters: /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s\-]$/,
        numbers: /^[0-9]$/,
        decimal: /^[0-9.]$/,
        currency: /^[0-9.,]$/,
        alphanumeric: /^[a-zA-Z0-9ÁÉÍÓÚÜÑáéíóúüñ\s\-_.,;]$/,
        none: /./
    }

    const tester = testMap[type] || testMap.none
    return tester.test(key)
}

export function toUppercase(value = '', force = false) {
    return force ? value.toUpperCase() : value
}

export function GetValidationMessage({
    value = '',
    required = false,
    minlength,
    maxlength,
    regex
}) {
    if (required && !value) return 'Este campo es obligatorio'
    if (minlength && value.length < minlength) return `Debe tener al menos ${minlength} caracteres`
    if (maxlength && value.length > maxlength) return `Debe tener máximo ${maxlength} caracteres`
    if (regex && !regex.test(value)) return 'El formato no es válido'
    return ''
}

export function GetLabelColor(error) {
    return error ? 'text-[var(--color-complement-2)]' : 'text-[var(--color-primary)]'
}

export function GetBorderColor({ error, success, isFocused, internalError }) {
    if (error || internalError) return 'var(--color-complement-2)'
    if (success) return 'var(--color-primary-hover)'
    if (isFocused) return 'var(--color-primary)'
    return 'var(--color-primary-light)'
}

export function GetCharCountColor(currentLength = 0, maxLength = 0) {
    if (!maxLength) return 'text-gray-500'

    const percent = (currentLength / maxLength) * 100
    if (currentLength > maxLength) return 'text-[var(--color-complement-2)]'
    if (percent >= 90) return 'text-[var(--color-primary)]'
    return 'text-gray-500'
}

export function GetErrorText({ error, internalError }) {
    if (internalError) return internalError
    if (Array.isArray(error)) return error[0]
    if (typeof error === 'string') return error
    return null
}
