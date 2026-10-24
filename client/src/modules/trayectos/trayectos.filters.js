import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"nombre_origen","label":"Origen"},
    {"type":"select","name":"nombre_destino","label":"Destino"},
    {"name":"nombre","label":"Nombre","type":"select"},
    {"name":"observacion","label":"Observación","type":"text"},
    {"name":"kilometros_min","label":"Distancia (km) desde","type":"number","field":"kilometros","operator":"min"},
    {"name":"kilometros_max","label":"Distancia (km) hasta","type":"number","field":"kilometros","operator":"max"}
];
