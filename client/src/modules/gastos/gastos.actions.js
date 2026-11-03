export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true
    },
    {
        "id": "annul",
        available: row => !row.id_pago_proveedor && !row.pago_directo_automatico,
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
