import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"ruc","label":"RUC"},
    {"type":"select","name":"direccion","label":"Dirección"},
    {"name":"nombre","label":"Nombre","type":"select"},
    {"name":"telefono","label":"Teléfono","type":"select"},
    {"name":"correo","label":"Correo","type":"select"}
];
