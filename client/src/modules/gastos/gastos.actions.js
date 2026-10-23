export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true
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
