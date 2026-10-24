import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"nombre_categoria","label":"Categoría"},
    {"type":"select","name":"marca","label":"Marca"},
    {"type":"select","name":"condicion_llanta","label":"Condición de llanta","options":[{"value":"NUEVA","label":"Nueva"},{"value":"REENCAUCHADA","label":"Reencauchada"}]},
    {"name":"nombre","label":"Nombre","type":"select"},
    {"name":"modelo","label":"Modelo","type":"select"},
    {"name":"medida","label":"Medida","type":"select"},
    {"name":"unidad_medida","label":"Unidad de medida","type":"select"},
    {"name":"stock_minimo_min","label":"Stock mínimo desde","type":"number","field":"stock_minimo","operator":"min"},
    {"name":"stock_minimo_max","label":"Stock mínimo hasta","type":"number","field":"stock_minimo","operator":"max"},
    {"name":"descripcion","label":"Descripción","type":"text"},
    {"name":"con_imagen","label":"Foto","type":"select","field":"imagen_url","operator":"presence","options":[{"value":"true","label":"Con foto"},{"value":"false","label":"Sin foto"}]}
];
