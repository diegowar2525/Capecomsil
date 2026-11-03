import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/mantenimientos';
export const api = {
    ...crearCatalogoApi(path),
    relacionados: async (action, id, signal) => action === 'history' ? { historial: await requestJson(`${path}/${id}/historial`, { signal }) } : null,
    opciones: (signal) => cargarOpciones({ id_factura_proveedor: ["/api/facturas-proveedor", "id_factura_proveedor", row => `${row.numero_factura} · ${row.nombre_proveedor} · ${row.total}`], "id_vehiculo": ["/api/vehiculos", "id_vehiculo", "placa"], "id_proveedor": ["/api/proveedores", "id_proveedor", "nombre"], "id_producto": ["/api/productos", "id_producto", "nombre"], "planes_cumplidos": ["/api/planes-mantenimiento", "id_plan_mantenimiento_vehiculo", row => `${row.nombre} · ${row.placa} · cada ${row.intervalo_km} km`] }, signal),
    ejecutar: (action, id, data) => {
        const route = { pay: 'pagos', annul: 'anular', finish: 'finalizar', fulfill: 'cumplimientos' }[action];
        if (!route) throw new Error('Acción no admitida.');
        return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
    }
};
