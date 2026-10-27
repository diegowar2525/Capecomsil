import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones, listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/pagos-proveedor';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas('/api/pagos-proveedor', {}, signal),
    opciones: (signal) => cargarOpciones({"id_factura_proveedor": ["/api/facturas-proveedor", "id_factura_proveedor", "numero_factura"]}, signal),
    ejecutar: (action, id, data) => {
        const route = { annul: 'anular', finish: 'finalizar', fulfill: 'cumplimientos' }[action];
        if (!route) throw new Error('Acción no admitida.');
        return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
    }
};
