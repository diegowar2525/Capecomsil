import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"text","name":"ruc","label":"RUC"},
    {"type":"text","name":"direccion","label":"Dirección"}
];
