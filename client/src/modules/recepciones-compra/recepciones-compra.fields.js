export const fields = [
    {
        "name": "id_factura_proveedor",
        "label": "Factura",
        "type": "select",
        "required": true,
        "source": "id_factura_proveedor"
    },
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
];
