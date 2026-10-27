import { listarPaginas } from '../../../services/consultas.api.js';
import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
export const api = {
 ...crearCatalogoApi('/api/viajes'),
    listar: signal => listarPaginas('/api/viajes', {}, signal),
 opciones: async (signal, action) => !['create','edit'].includes(action) ? {} : Object.fromEntries(await Promise.all(
  [['terminales','terminales'], ['gasolineras','gasolineras'], ['vehiculos','vehiculos'], ['choferes','choferes'], ['productos','productos-transportados'], ['trayectos','trayectos']].map(async ([key,path]) => [key, await requestJson(`/api/${path}`, { signal })])
 )),
 relacionados: async (action, id, signal) => action === 'history' ? { historial: await requestJson(`/api/viajes/${id}/historial`, { signal }) } : null,
 ejecutar: (action, id, data) => {
  if (action !== 'annul') throw new Error('Acción no admitida.');
  return requestJson(`/api/viajes/${id}/anular`, { method: 'POST', data });
 }
};
