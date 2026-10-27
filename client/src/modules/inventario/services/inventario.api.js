import { requestJson } from '../../../services/http.js';
import { cargarOpciones, listarPaginas } from '../../../services/consultas.api.js';
export const api = {
 listar: signal => requestJson('/api/inventario/stock', { signal }),
 consultar: (id, signal) => requestJson(`/api/inventario/stock/${id}`, { signal }),
 crear: data => requestJson('/api/inventario/ajustes', { method: 'POST', data }),
 opciones: signal => cargarOpciones({ id_producto: ['/api/productos','id_producto','nombre'] }, signal),
 ejecutar: async (action, id, values) => {
  if (action === 'low') return { stock: await requestJson('/api/inventario/bajo-stock') };
  if (action === 'moves') return { movimientos: await listarPaginas('/api/inventario/movimientos', values) };
  if (action === 'reverse') return requestJson(`/api/inventario/ajustes/${values.id_movimiento}/revertir`, { method: 'POST', data: { motivo: values.motivo } });
  throw new Error('Acción no admitida.');
 }
};
