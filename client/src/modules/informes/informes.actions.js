export const actions = [
    {
        "id": "viajes",
        "label": "Viajes",
        "global": true,
        "readOnly": true,
        "fields": [
            {
                "name": "fecha_desde",
                "label": "Desde",
                "type": "date",
                "required": true
            },
            {
                "name": "fecha_hasta",
                "label": "Hasta",
                "type": "date",
                "required": true
            },
            {
                "name": "id_vehiculo",
                "label": "Vehículo",
                "type": "select",
                "required": false,
                "source": "id_vehiculo"
            }
        ],
        "columns": [],
        "tables": [
            {
                "name": "viajes",
                "label": "Viajes",
                "columns": [
                    {
                        "key": "id_viaje",
                        "label": "Viaje"
                    },
                    {
                        "key": "placa",
                        "label": "Placa"
                    },
                    {
                        "key": "fecha_inicio",
                        "label": "Inicio"
                    },
                    {
                        "key": "ingreso_transporte",
                        "label": "Ingreso"
                    },
                    {
                        "key": "costo_estimado_total",
                        "label": "Costo estimado"
                    },
                    {
                        "key": "margen_estimado",
                        "label": "Margen estimado"
                    }
                ]
            }
        ]
    },
    {
        "id": "resumen-economico",
        "label": "Resumen económico",
        "global": true,
        "readOnly": true,
        "fields": [
            {
                "name": "fecha_desde",
                "label": "Desde",
                "type": "date",
                "required": true
            },
            {
                "name": "fecha_hasta",
                "label": "Hasta",
                "type": "date",
                "required": true
            },
            {
                "name": "id_vehiculo",
                "label": "Vehículo",
                "type": "select",
                "required": false,
                "source": "id_vehiculo"
            }
        ],
        "columns": [],
        "tables": [
            {
                "name": "resumen-economico",
                "label": "Resumen económico",
                "columns": [
                    {
                        "key": "cantidad_viajes",
                        "label": "Viajes"
                    },
                    {
                        "key": "ingreso_transporte",
                        "label": "Ingresos"
                    },
                    {
                        "key": "costo_estimado_viajes",
                        "label": "Costos estimados"
                    },
                    {
                        "key": "margen_estimado_viajes",
                        "label": "Margen estimado"
                    },
                    {
                        "key": "gastos_registrados_periodo",
                        "label": "Gastos registrados"
                    }
                ]
            }
        ]
    },
    {
        "id": "viaticos",
        "label": "Viáticos",
        "global": true,
        "readOnly": true,
        "fields": [
            {
                "name": "fecha_desde",
                "label": "Desde",
                "type": "date",
                "required": true
            },
            {
                "name": "fecha_hasta",
                "label": "Hasta",
                "type": "date",
                "required": true
            },
            {
                "name": "id_chofer",
                "label": "Chofer",
                "type": "select",
                "required": false,
                "source": "id_chofer"
            }
        ],
        "columns": [],
        "tables": [
            {
                "name": "viaticos",
                "label": "Viáticos",
                "columns": [
                    {
                        "key": "nombre",
                        "label": "Chofer"
                    },
                    {
                        "key": "fecha",
                        "label": "Fecha"
                    },
                    {
                        "key": "estimado",
                        "label": "Estimado"
                    },
                    {
                        "key": "gasto_real_registrado",
                        "label": "Registrado"
                    },
                    {
                        "key": "diferencia",
                        "label": "Diferencia"
                    },
                    {
                        "key": "estado_comparacion",
                        "label": "Comparación"
                    }
                ]
            }
        ]
    },
    {
        "id": "consumo-combustible",
        "label": "Consumo de combustible",
        "global": true,
        "readOnly": true,
        "fields": [
            {
                "name": "fecha_desde",
                "label": "Desde",
                "type": "date",
                "required": true
            },
            {
                "name": "fecha_hasta",
                "label": "Hasta",
                "type": "date",
                "required": true
            },
            {
                "name": "id_vehiculo",
                "label": "Vehículo",
                "type": "select",
                "required": false,
                "source": "id_vehiculo"
            }
        ],
        "columns": [],
        "tables": [
            {
                "name": "consumo-combustible",
                "label": "Consumo de combustible",
                "columns": [
                    {
                        "key": "placa",
                        "label": "Vehículo"
                    },
                    {
                        "key": "fecha_inicio",
                        "label": "Inicio"
                    },
                    {
                        "key": "fecha_fin",
                        "label": "Fin"
                    },
                    {
                        "key": "galones_consumidos",
                        "label": "Galones"
                    },
                    {
                        "key": "consumo_real_galones_km",
                        "label": "Consumo real (gal/km)"
                    },
                    {
                        "key": "estado_comparacion",
                        "label": "Comparación"
                    }
                ]
            }
        ]
    }
];
