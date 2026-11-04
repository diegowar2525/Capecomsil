import { resumirRecorrido } from './domain/resumen-recorrido.js';

export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            {
                "name": "detalles",
                "label": "Entregas",
                "columns": [
                    {
                        "key": "id_detalle_viaje",
                        "label": "Entrega"
                    },
                    {
                        "key": "nombre_gasolinera",
                        "label": "Gasolinera"
                    },
                    {
                        "key": "galones",
                        "label": "Galones"
                    },
                    {
                        "key": "tarifa_aplicada",
                        "label": "Tarifa"
                    },
                    {
                        "key": "valor_transporte",
                        "label": "Importe"
                    }
                ]
            },
            {
                "name": "tramos",
                "label": "Recorrido",
                transform: resumirRecorrido,
                "columns": [
                    { "key": "recorrido", "label": "Recorrido" },
                    { "key": "kilometros", "label": "Kilómetros totales" }
                ]
            },
            {
                "name": "costos",
                "label": "Costos",
                "columns": [
                    {
                        "key": "tipo_costo",
                        "label": "Tipo"
                    },
                    {
                        "key": "valor",
                        "label": "Valor"
                    }
                ]
            }
        ]
    },
    {
        "id": "edit",
        "label": "Editar viaje",
        "useFields": true,
        "states": [
            "REGISTRADO"
        ]
    },
    {
        "id": "annul",
        "label": "Anular",
        "fields": [
            {
                "name": "motivo",
                "label": "Motivo",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "states": [
            "REGISTRADO"
        ]
    },
    {
        "id": "history",
        "label": "Historial",
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "historial",
                "label": "Modificaciones",
                "columns": [
                    {
                        "key": "fecha",
                        "label": "Fecha"
                    },
                    {
                        "key": "id_actor",
                        "label": "Usuario"
                    },
                    {
                        "key": "motivo",
                        "label": "Motivo"
                    },
                    {
                        "key": "version_anterior",
                        "label": "Versión anterior"
                    },
                    {
                        "key": "version_nueva",
                        "label": "Nueva versión"
                    }
                ]
            }
        ]
    }
];
