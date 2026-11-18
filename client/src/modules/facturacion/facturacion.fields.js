export const fields = [
    { name: 'id_empresa', label: 'Empresa / Cliente', type: 'select', required: true, source: 'id_empresa' },
    { name: 'id_liquidaciones', label: 'Liquidaciones confirmadas', type: 'select', multiple: true, required: true, source: 'id_liquidaciones' },
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
