import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"marca","label":"Marca"},
    {"type":"select","name":"capacidad_galones","label":"Capacidad (galones)"},
    {"type":"select","name":"anio","label":"Año"}
];
