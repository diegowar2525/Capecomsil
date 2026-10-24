import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"nombre_origen","label":"Origen"},
    {"type":"select","name":"nombre_destino","label":"Destino"}
];
