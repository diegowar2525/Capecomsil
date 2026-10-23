export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            {
                "name": "detalles",
                "label": "Conceptos",
                "columns": [
                    {
                        "key": "descripcion",
                        "label": "Descripción"
                    },
                    {
                        "key": "cantidad",
                        "label": "Cantidad"
                    },
                    {
                        "key": "precio_unitario",
                        "label": "Precio"
                    },
                    {
                        "key": "porcentaje_impuesto",
                        "label": "Impuesto"
                    }
                ]
            }
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
            "REGISTRADA"
        ],
        "message": "La anulación conserva el registro y requiere un motivo."
    },
    {
        "id": "payments",
        "label": "Consultar pagos",
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "pagos",
                "label": "Pagos",
                "columns": [
                    {
                        "key": "id_pago_proveedor",
                        "label": "Código"
                    },
                    {
                        "key": "id_factura_proveedor",
                        "label": "Factura"
                    },
                    {
                        "key": "fecha_pago",
                        "label": "Fecha"
                    },
                    {
                        "key": "monto",
                        "label": "Monto"
                    },
                    {
                        "key": "forma_pago",
                        "label": "Forma de pago"
                    },
                    {
                        "key": "estado",
                        "label": "Estado"
                    }
                ]
            }
        ]
    },
    {
        "id": "receipts",
        "label": "Consultar recepciones",
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "recepciones",
                "label": "Recepciones",
                "columns": [
                    {
                        "key": "id_recepcion_compra",
                        "label": "Código"
                    },
                    {
                        "key": "fecha_recepcion",
                        "label": "Fecha"
                    },
                    {
                        "key": "numero_comprobante",
                        "label": "Comprobante"
                    },
                    {
                        "key": "estado",
                        "label": "Estado"
                    }
                ]
            }
        ]
    },
    {
        "id": "pending",
        "label": "Pendientes de recepción",
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "pendientes",
                "label": "Pendientes",
                "columns": [
                    {
                        "key": "id_detalle_factura_proveedor",
                        "label": "Detalle"
                    },
                    {
                        "key": "descripcion",
                        "label": "Descripción"
                    },
                    {
                        "key": "cantidad_facturada",
                        "label": "Facturado"
                    },
                    {
                        "key": "cantidad_recibida",
                        "label": "Recibido"
                    },
                    {
                        "key": "pendiente_recibir",
                        "label": "Pendiente"
                    }
                ]
            }
        ]
    },
    {
        "id": "receive",
        "label": "Registrar recepción",
        "fields": [
            {
                "name": "fecha_recepcion",
                "label": "Fecha",
                "type": "date",
                "required": true
            },
            {
                "name": "numero_comprobante",
                "label": "Comprobante",
                "type": "text",
                "required": false,
                "maxLength": 100
            },
            {
                "name": "observacion",
                "label": "Observación",
                "type": "textarea",
                "required": false
            },
            {
                "name": "detalles",
                "label": "Productos recibidos",
                "type": "rows",
                "fields": [
                    {
                        "name": "id_detalle_factura_proveedor",
                        "label": "Detalle de factura",
                        "type": "select",
                        "required": true,
                        "source": "id_detalle_factura_proveedor"
                    },
                    {
                        "name": "cantidad_recibida",
                        "label": "Cantidad recibida",
                        "type": "number",
                        "required": true,
                        "min": 0.01,
                        "step": 0.01
                    },
                    {
                        "name": "observacion",
                        "label": "Observación",
                        "type": "textarea",
                        "required": false
                    }
                ],
                "minRows": 1
            }
        ],
        "states": [
            "REGISTRADA"
        ]
    }
];
