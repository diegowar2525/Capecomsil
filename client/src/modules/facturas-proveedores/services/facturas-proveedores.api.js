import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/facturas-proveedor';
export const api = {
    ...crearCatalogoApi(path),
    opciones: (signal) => cargarOpciones({"id_proveedor": ["/api/proveedores", "id_proveedor", "nombre"], "id_producto": ["/api/productos", "id_producto", "nombre"]}, signal),
    ejecutar: (action, id, data) => {
        const route = { annul: 'anular', finish: 'finalizar', fulfill: 'cumplimientos' }[action];
        if (!route) throw new Error('Acción no admitida.');
        return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
    }
};
api.relacionados = async (action, id, signal) => {
    const relation = { payments: ['pagos', 'pagos'], receipts: ['recepciones', 'recepciones'], pending: ['pendientes-recepcion', 'pendientes'] }[action];
    return relation ? { [relation[1]]: await requestJson(`${path}/${id}/${relation[0]}`, { signal }) } : null;
};
const opcionesBase = api.opciones;
api.opciones = async (signal, action, id) => {
    if (action === 'receive') {
        const rows = await requestJson(`${path}/${id}/pendientes-recepcion`, { signal });
        return { id_detalle_factura_proveedor: rows.map(row => ({ value: String(row.id_detalle_factura_proveedor), label: `${row.descripcion} (pendiente: ${row.pendiente_recibir})` })) };
    }
    return ['create', 'edit'].includes(action) ? opcionesBase(signal) : {};
};
const ejecutarBase = api.ejecutar;
api.ejecutar = (action, id, data) => action === 'receive' ? requestJson('/api/recepciones-compra', { method: 'POST', data: { ...data, id_factura_proveedor: id } }) : ejecutarBase(action, id, data);
