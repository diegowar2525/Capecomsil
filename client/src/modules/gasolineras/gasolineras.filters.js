import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"agente_retencion","label":"Agente de retención","options":[{"value":"true","label":"Sí"},{"value":"false","label":"No"}]}
];
