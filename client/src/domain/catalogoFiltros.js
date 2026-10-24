const normalizar = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const filtroEstado = {
    name: 'estado', label: 'Estado', type: 'select',
    options: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]
};

export function opcionesFiltro(filter, data) {
    if (filter.options) return filter.options;
    const opciones = new Map();
    for (const row of data) {
        const value = row[filter.name];
        if (value === null || value === undefined || value === '') continue;
        opciones.set(String(value), String(row[filter.labelKey] ?? value));
    }
    return [...opciones].map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }));
}

export function filtrarOrdenarCatalogo(data, { columns, rowKey, filters = [], search = '', values = {}, order = 'asc' }) {
    const query = normalizar(search);
    return data.filter((row) => {
        if (query && !columns.some(({ key }) => normalizar(row[key]).includes(query))) return false;
        return filters.every((filter) => {
            const selected = values[filter.name];
            if (selected === '' || selected === undefined) return true;
            const actual = row[filter.name];
            return filter.type === 'text' ? normalizar(actual).includes(normalizar(selected)) : String(actual) === String(selected);
        });
    }).sort((a, b) => (Number(a[rowKey]) - Number(b[rowKey])) * (order === 'asc' ? 1 : -1));
}
