import { requestJson } from '../../../services/http.js';
import { cargarOpciones, consultaUrl } from '../../../services/consultas.api.js';
export const api = {
 buscar: (values, signal) => requestJson(consultaUrl('/api/remuneraciones-chofer', values), { signal }),
 consultar: (id, signal) => requestJson(`/api/remuneraciones-chofer/${id}`, { signal }),
 cobertura: (values, signal) => requestJson(consultaUrl('/api/remuneraciones-chofer/cobertura', values), { signal }),
 opciones: signal => cargarOpciones({ id_chofer: ['/api/choferes','id_chofer','nombre'] }, signal)
};
