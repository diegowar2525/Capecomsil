import { requestJson } from '../../../services/http.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
export const api = {
 buscar: (values, signal) => requestJson(`/api/facturas-proveedor/${values.id_factura_proveedor}/recepciones`, { signal }),
 consultar: async () => null,
 crear: data => requestJson('/api/recepciones-compra', { method: 'POST', data }),
 opciones: signal => cargarOpciones({ id_factura_proveedor: ['/api/facturas-proveedor','id_factura_proveedor','numero_factura'] }, signal),
 pendientes: (id, signal) => requestJson(`/api/facturas-proveedor/${id}/pendientes-recepcion`, { signal }),
 ejecutar: async (action, id, values) => {
  if (action === 'pending') return { pendientes: await api.pendientes(values.id_factura_proveedor) };
  if (action === 'annul') return requestJson(`/api/recepciones-compra/${id}/anular`, { method: 'POST', data: values });
  throw new Error('Acción no admitida.');
 }
};
