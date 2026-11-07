import { cargarOpciones, listarPaginas } from '../../../services/consultas.api.js';
export const api = {
    buscar: (params, signal) => listarPaginas('/api/informes/produccion', params, signal),
    opciones: signal => cargarOpciones({ id_vehiculo: ['/api/vehiculos', 'id_vehiculo', 'placa'], id_terminal: ['/api/terminales', 'id_terminal', 'nombre'] }, signal)
};
