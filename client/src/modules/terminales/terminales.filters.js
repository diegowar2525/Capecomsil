import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"ubicacion","label":"Ubicación"},
    {"name":"nombre","label":"Nombre","type":"select"}
];
