import { requestJson } from '../../../services/http.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
export const api = {
 buscar: async (values, signal) => (await requestJson(`/api/viajes/${values.id_viaje}`, { signal })).costos,
 opciones: signal => cargarOpciones({ id_viaje: ['/api/viajes','id_viaje','id_viaje'] }, signal)
};
