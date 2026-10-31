import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones, consultaUrl, listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/liquidaciones';
export const api = {
 ...crearCatalogoApi(path),
 listar: signal => listarPaginas(path, {}, signal),
 opciones: signal => cargarOpciones({ id_gasolinera: ['/api/gasolineras', 'id_gasolinera', 'nombre'] }, signal),
 disponibles: (values, signal) => requestJson(consultaUrl(`${path}/entregas-disponibles`, values), { signal }),
 relacionados: async (action, id, signal) => action.id === 'detail' ? { facturas: await listarPaginas('/api/facturas-cliente', { id_liquidacion: id }, signal) } : {},
 eliminar: (id, registro) => requestJson(`${path}/${id}`, { method: 'DELETE', data: { version: registro.version } }),
 ejecutar: async (action, id, data) => {
  if (action === 'available') return api.disponibles(data);
  if (action === 'invoice') return requestJson('/api/facturas-cliente', { method: 'POST', data: { ...data, id_liquidacion: id } });
  const route = { send: 'enviar', confirm: 'confirmar', annul: 'anular' }[action];
  if (!route) throw new Error('Acción no admitida.');
  return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
 }
};
