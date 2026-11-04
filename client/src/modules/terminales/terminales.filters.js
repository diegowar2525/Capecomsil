import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {name: 'provincia', label: 'Provincia', type: 'select'},
    {name: 'ciudad', label: 'Ciudad', type: 'select'},
    {"type":"select","name":"ubicacion","label":"Ubicación"},
    {"name":"nombre","label":"Nombre","type":"select"}
];
