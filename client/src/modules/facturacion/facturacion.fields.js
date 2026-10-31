export const fields = [
    {
        "name": "id_liquidacion",
        "label": "Liquidación confirmada",
        "type": "select",
        "required": true,
        "source": "id_liquidacion"
    },
    {
        "name": "numero_factura",
        "label": "Número de factura",
        "type": "text",
        "required": true,
        "maxLength": 50
    },
    {
        "name": "fecha_emision",
        "label": "Fecha de emisión",
        "type": "date",
        "required": true
    },
    {
        "name": "fecha_vencimiento",
        "label": "Vencimiento (opcional)",
        "type": "date",
        "required": false
    },
    {
        "name": "observacion",
        "label": "Observación (opcional)",
        "type": "textarea",
        "required": false
    }
];
