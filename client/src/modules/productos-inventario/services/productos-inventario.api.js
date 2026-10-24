import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';

export const api = {
    ...crearCatalogoApi('/api/productos'),
    opciones: async (signal) => {
        const rows = await requestJson('/api/categorias-producto', { signal });
        return { id_categoria: rows.map((row) => ({
            value: String(row.id_categoria), label: row.nombre + (row.estado ? '' : ' (inactiva)'), es_llanta: row.es_llanta
        })) };
    }
};
