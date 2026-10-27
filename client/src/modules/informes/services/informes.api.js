import { requestJson } from '../../../services/http.js';
import { cargarOpciones, consultaUrl, listarPaginas } from '../../../services/consultas.api.js';
export const api = {
 listar: async () => [],
 opciones: signal => cargarOpciones({ id_vehiculo: ['/api/vehiculos','id_vehiculo','placa'], id_chofer: ['/api/choferes','id_chofer','nombre'] }, signal),
 ejecutar: async (action, id, values) => {
  if (!['viajes','resumen-economico','viaticos','consumo-combustible'].includes(action)) throw new Error('Informe no admitido.');
  const result = action === 'resumen-economico' ? await requestJson(consultaUrl(`/api/informes/${action}`, values)) : await listarPaginas(`/api/informes/${action}`, values);
  return { [action]: Array.isArray(result) ? result : [result] };
 }
};
