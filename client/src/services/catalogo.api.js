import { requestJson } from './http.js';

export function crearCatalogoApi(path) {
    return {
        listar: (signal) => requestJson(path, { signal }),
        consultar: (id, signal) => requestJson(`${path}/${id}`, { signal }),
        crear: (data) => requestJson(path, { method: 'POST', data }),
        actualizar: (id, data) => requestJson(`${path}/${id}`, { method: 'PUT', data }),
        eliminar: (id) => requestJson(`${path}/${id}`, { method: 'DELETE' })
    };
}
