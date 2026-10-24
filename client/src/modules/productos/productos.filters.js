import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"unidad_medida","label":"Unidad de medida"},
    {"name":"nombre","label":"Nombre","type":"text"},
    {"name":"descripcion","label":"Descripción","type":"text"}
];
