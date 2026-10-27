import { requestJson } from './http.js';

export const consultaUrl = (path, values = {}) => {
    const query = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== null && value !== undefined && value !== ''));
    return `${path}${query.size ? `?${query}` : ''}`;
};

export async function listarPaginas(path, values = {}, signal) {
    const rows = [];
    for (let offset = 0; ; offset += 200) {
        const page = await requestJson(consultaUrl(path, { ...values, limit: 200, offset }), { signal });
        if (!Array.isArray(page)) throw new Error('El servidor no devolvió un listado válido.');
        rows.push(...page);
        if (page.length < 200) return rows;
    }
}

// Cada módulo declara los catálogos que necesita; no se consultan recursos ajenos.
export const cargarOpciones = async (sources, signal) => Object.fromEntries(await Promise.all(
    Object.entries(sources).map(async ([key, [path, id, label]]) => {
        const rows = ['/api/viajes', '/api/gastos', '/api/abastecimientos-combustible', '/api/pagos-proveedor'].includes(path)
            ? await listarPaginas(path, {}, signal) : await requestJson(path, { signal });
        return [key, rows.map(row => ({ value: String(row[id]), label: typeof label === 'function' ? label(row) : `${row[label] ?? row[id]}`, registro: row }))];
    })
));
