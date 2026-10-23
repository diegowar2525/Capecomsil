export const actions = [
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
        "id": "pending",
        "label": "Pendientes de recepción",
        "global": true,
        "fields": [
            {
                "name": "id_factura_proveedor",
                "label": "Factura",
                "type": "select",
                "required": true,
                "source": "id_factura_proveedor"
            }
        ],
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
    }
];
