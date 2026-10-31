export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true
    },
    {
        "id": "annul",
        "label": "Anular",
        "states": [
            "REGISTRADO"
        ],
        "fields": [
            {
                "name": "motivo",
                "label": "Motivo de anulación",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "message": "La anulación conserva el cobro y restituye el saldo de la factura."
    }
];
