export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            {
                "name": "detalles",
                "label": "Materiales",
                "columns": [
                    {
                        "key": "id_producto",
                        "label": "Producto"
                    },
                    {
                        "key": "descripcion_producto",
                        "label": "Descripción"
                    },
                    {
                        "key": "cantidad",
                        "label": "Cantidad"
                    }
                ]
            }
        ]
    },
    {
        "id": "finish",
        "label": "Finalizar",
        "fields": [
            {
                "name": "fecha_fin",
                "label": "Fecha de finalización",
                "type": "datetime-local",
                "required": true
            },
            {
                "name": "planes_cumplidos",
                "label": "Planes cumplidos",
                "type": "select",
                "required": false,
                "source": "planes_cumplidos",
                "multiple": true
            }
        ],
        "states": [
            "REGISTRADO"
        ],
        "requiresOpen": true
    },
    {
        "id": "fulfill",
        "label": "Registrar cumplimientos",
        "fields": [
            {
                "name": "planes_cumplidos",
                "label": "Planes cumplidos",
                "type": "select",
                "required": true,
                "source": "planes_cumplidos",
                "multiple": true
            }
        ],
        "states": [
            "REGISTRADO"
        ],
        "requiresFinished": true
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
        ],
        "message": "La anulación conserva el registro y requiere un motivo."
    }
];
