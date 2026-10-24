import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"agente_retencion","label":"Agente de retención","options":[{"value":"true","label":"Sí"},{"value":"false","label":"No"}]},
    {"name":"nombre","label":"Nombre","type":"select"},
    {"name":"ruc","label":"RUC","type":"select"},
    {"name":"direccion","label":"Dirección","type":"select"},
    {"name":"telefono","label":"Teléfono","type":"select"},
    {"name":"correo","label":"Correo","type":"select"},
    {"name":"representante_legal","label":"Representante legal","type":"select"}
];
