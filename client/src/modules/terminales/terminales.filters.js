import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"text","name":"ubicacion","label":"Ubicación"},
    {"name":"nombre","label":"Nombre","type":"text"}
];
