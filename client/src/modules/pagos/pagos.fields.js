export const fields = [
    {
        "name": "id_factura",
        "label": "Factura con saldo pendiente",
        "type": "select",
        "required": true,
        "source": "id_factura"
    },
    {
        "name": "fecha_pago",
        "label": "Fecha del cobro",
        "type": "date",
        "required": true
    },
    {
        "name": "monto",
        "label": "Monto",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "forma_pago",
        "label": "Forma de pago",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "EFECTIVO",
                "label": "EFECTIVO"
            },
            {
                "value": "TRANSFERENCIA",
                "label": "TRANSFERENCIA"
            },
            {
                "value": "CHEQUE",
                "label": "CHEQUE"
            },
            {
                "value": "OTRO",
                "label": "OTRO"
            }
        ]
    },
    {
        "name": "banco",
        "label": "Banco (opcional)",
        "type": "text",
        "required": false
    },
    {
        "name": "numero_comprobante",
        "label": "Comprobante o número de cheque",
        "type": "text",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "observacion",
        "label": "Observación (opcional)",
        "type": "textarea",
        "required": false
    }
];
