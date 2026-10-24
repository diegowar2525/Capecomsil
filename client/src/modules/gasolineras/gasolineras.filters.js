import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"agente_retencion","label":"Agente de retención","options":[{"value":"true","label":"Sí"},{"value":"false","label":"No"}]},
    {"name":"nombre","label":"Nombre","type":"text"},
    {"name":"ruc","label":"RUC","type":"text"},
    {"name":"direccion","label":"Dirección","type":"text"},
    {"name":"telefono","label":"Teléfono","type":"text"},
    {"name":"correo","label":"Correo","type":"text"},
    {"name":"representante_legal","label":"Representante legal","type":"text"}
];
