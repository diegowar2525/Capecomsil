import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones, listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/abastecimientos-combustible';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas('/api/abastecimientos-combustible', {}, signal),
    opciones: (signal) => cargarOpciones({"id_vehiculo": ["/api/vehiculos", "id_vehiculo", "placa"], "id_proveedor": ["/api/proveedores", "id_proveedor", "nombre"]}, signal),
    ejecutar: (action, id, data) => {
        const route = { annul: 'anular', finish: 'finalizar', fulfill: 'cumplimientos' }[action];
        if (!route) throw new Error('Acción no admitida.');
        return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
    }
};
