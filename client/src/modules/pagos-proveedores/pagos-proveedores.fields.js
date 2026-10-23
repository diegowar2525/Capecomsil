export const fields = [
    {
        "name": "id_factura_proveedor",
        "label": "Factura",
        "type": "select",
        "required": true,
        "source": "id_factura_proveedor"
    },
    {
        "name": "fecha_pago",
        "label": "Fecha",
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
                "label": "Efectivo"
            },
            {
                "value": "TRANSFERENCIA",
                "label": "Transferencia"
            },
            {
                "value": "CHEQUE",
                "label": "Cheque"
            },
            {
                "value": "OTRO",
                "label": "Otro"
            }
        ]
    },
    {
        "name": "numero_cheque",
        "label": "Número de cheque",
        "type": "text",
        "required": true,
        "maxLength": 100,
        "when": {
            "field": "forma_pago",
            "value": "CHEQUE"
        }
    },
    {
        "name": "numero_comprobante",
        "label": "Comprobante",
        "type": "text",
        "required": false,
        "maxLength": 100,
        "requiredWhen": {
            "field": "forma_pago",
            "value": "TRANSFERENCIA"
        }
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
