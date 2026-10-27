export function formError(field, message, code = 'VALIDATION_ERROR') {
    return Object.assign(new Error(message), { field, code });
}
