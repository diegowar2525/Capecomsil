import { formError } from './formError.js';

export const campoVisible = (field, values) => !field.when || values[field.when.field] === field.when.value;
export function valoresIniciales(fields, registro = {}) {
    return Object.fromEntries(fields.map(field => {
        const value = registro[field.name];
        if (field.type === 'rows') return [field.name, (value ?? Array.from({ length: field.minRows ?? 0 }, () => ({}))).map(row => valoresIniciales(field.fields, row))];
        if (field.type === 'group') return [field.name, valoresIniciales(field.fields, value ?? {})];
        if (field.multiple) return [field.name, (value ?? []).map(String)];
        if (value && field.type === 'date') return [field.name, String(value).slice(0, 10)];
        if (value && field.type === 'datetime-local') {
            const date = new Date(value);
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            return [field.name, local];
        }
        return [field.name, value ?? (field.type === 'checkbox' ? field.defaultChecked ?? false : field.defaultValue ?? '')];
    }));
}

// Los campos ocultos se omiten; los decimales se conservan como texto.
export function prepararCampos(fields, values) {
    return Object.fromEntries(fields.filter(field => campoVisible(field, values)).map(field => {
        const raw = values[field.name];
        const required = field.required || (field.requiredWhen && values[field.requiredWhen.field] === field.requiredWhen.value);
        if (field.type === 'checkbox') return [field.name, raw === true];
        if (field.type === 'group') return [field.name, prepararCampos(field.fields, raw ?? {})];
        if (field.type === 'rows' || field.multiple) {
            const rows = raw ?? [];
            if (rows.length < (field.minRows ?? (required ? 1 : 0))) throw formError(field.name, `Complete ${field.label}.`);
            return [field.name, field.multiple ? rows : rows.map(row => prepararCampos(field.fields, row))];
        }
        const value = String(raw ?? '').trim();
        if (required && !value) throw formError(field.name, `El campo ${field.label} es obligatorio.`);
        return [field.name, value || null];
    }));
}
