export function valoresIniciales(fields, registro = {}) {
    return Object.fromEntries(fields.map((field) => [field.name,
        registro[field.name] ?? (field.type === 'checkbox' ? field.defaultChecked ?? false : field.defaultValue ?? '')]));
}

// Solo los campos declarados se envían: los importes decimales se conservan como texto.
export function prepararCampos(fields, values) {
    return Object.fromEntries(fields.map((field) => {
        if (field.type === 'checkbox') return [field.name, values[field.name] === true];
        const value = String(values[field.name] ?? '').trim();
        if (field.required && (!field.when || values[field.when.field] === field.when.value) && !value) {
            throw new Error(`El campo ${field.label} es obligatorio.`);
        }
        return [field.name, value || null];
    }));
}
