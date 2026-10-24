import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"text","name":"ruc","label":"RUC"},
    {"type":"text","name":"direccion","label":"Dirección"},
    {"name":"nombre","label":"Nombre","type":"text"},
    {"name":"telefono","label":"Teléfono","type":"text"},
    {"name":"correo","label":"Correo","type":"text"}
];
