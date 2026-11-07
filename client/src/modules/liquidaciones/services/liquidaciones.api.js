import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { cargarOpciones, consultaUrl, listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/liquidaciones';
export const api = {
 ...crearCatalogoApi(path),
 listar: signal => listarPaginas(path, {}, signal),
 opciones: async signal => {
  const [catalogos, viajes] = await Promise.all([
   cargarOpciones({ id_gasolinera: ['/api/gasolineras', 'id_gasolinera', 'nombre'] }, signal),
   listarPaginas('/api/viajes', { estado: 'ANULADO' }, signal)
  ]);
  return { ...catalogos, viajes_anulados: viajes.map(v => ({ value: String(v.id_viaje), label: `Viaje ${v.id_viaje} · ${v.placa ?? ''} · ${v.fecha_inicio?.slice(0,10) ?? ''}` })) };
 },
 disponibles: (values, signal) => requestJson(consultaUrl(`${path}/entregas-disponibles`, values), { signal }),
 relacionados: async (action, id, signal) => action.id === 'detail' ? { facturas: await listarPaginas('/api/facturas-cliente', { id_liquidacion: id }, signal) } : {},
 eliminar: (id, registro) => requestJson(`${path}/${id}`, { method: 'DELETE', data: { version: registro.version } }),
 ejecutar: async (action, id, data) => {
  if (action === 'available') return api.disponibles(data);
  if (action === 'invoice') return requestJson('/api/facturas-cliente', { method: 'POST', data: { ...data, id_liquidacion: id } });
  const route = { reopen: 'reabrir', send: 'enviar', confirm: 'confirmar', annul: 'anular' }[action];
  if (!route) throw new Error('Acción no admitida.');
  return requestJson(`${path}/${id}/${route}`, { method: 'POST', data });
 }
};
