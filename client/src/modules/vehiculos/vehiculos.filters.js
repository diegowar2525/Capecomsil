import { filtroEstado } from '../../domain/catalogoFiltros.js';

export const filters = [
    filtroEstado,
    {"type":"select","name":"marca","label":"Marca"},
    {"type":"select","name":"capacidad_galones","label":"Capacidad (galones)"},
    {"type":"select","name":"anio","label":"Año"},
    {"name":"placa","label":"Placa","type":"select"},
    {"name":"modelo","label":"Modelo","type":"select"},
    {"name":"capacidad_galones_min","label":"Capacidad (galones) desde","type":"number","field":"capacidad_galones","operator":"min"},
    {"name":"capacidad_galones_max","label":"Capacidad (galones) hasta","type":"number","field":"capacidad_galones","operator":"max"},
    {"name":"anio_min","label":"Año desde","type":"number","field":"anio","operator":"min"},
    {"name":"anio_max","label":"Año hasta","type":"number","field":"anio","operator":"max"},
    {"name":"kilometraje_base_min","label":"Kilometraje base desde","type":"number","field":"kilometraje_base","operator":"min"},
    {"name":"kilometraje_base_max","label":"Kilometraje base hasta","type":"number","field":"kilometraje_base","operator":"max"},
    {"name":"con_imagen","label":"Foto","type":"select","field":"imagen_url","operator":"presence","options":[{"value":"true","label":"Con foto"},{"value":"false","label":"Sin foto"}]}
];
