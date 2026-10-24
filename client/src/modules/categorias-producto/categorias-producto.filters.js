import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"es_llanta","label":"Categoría de llantas","options":[{"value":"true","label":"Sí"},{"value":"false","label":"No"}]},
    {"name":"nombre","label":"Nombre","type":"text"},
    {"name":"descripcion","label":"Descripción","type":"text"}
];
