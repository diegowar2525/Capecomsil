import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"tipo_remuneracion","label":"Remuneración","options":[{"value":"DIARIO_FIJO","label":"Diario fijo"},{"value":"DIA_TRABAJADO","label":"Día trabajado"}]},
    {"name":"nombre","label":"Nombre","type":"text"},
    {"name":"cedula","label":"Cédula","type":"text"},
    {"name":"telefono","label":"Teléfono","type":"text"},
    {"name":"con_imagen","label":"Foto","type":"select","field":"imagen_url","operator":"presence","options":[{"value":"true","label":"Con foto"},{"value":"false","label":"Sin foto"}]}
];
