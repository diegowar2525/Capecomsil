import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"nombre_categoria","label":"Categoría"},
    {"type":"select","name":"marca","label":"Marca"},
    {"type":"select","name":"condicion_llanta","label":"Condición de llanta","options":[{"value":"NUEVA","label":"Nueva"},{"value":"REENCAUCHADA","label":"Reencauchada"}]}
];
