export const filters = [
    {
        "name": "fecha_desde",
        "label": "Desde",
        "type": "date",
        "required": false
    },
    {
        "name": "fecha_hasta",
        "label": "Hasta",
        "type": "date",
        "required": false
    },
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "id_factura_proveedor",
        "label": "Factura",
        "type": "select",
        "required": false,
        "source": "id_factura_proveedor"
    },
    {
        "name": "estado",
        "label": "Estado",
        "type": "select",
        "required": false,
        "options": [
            {
                "value": "REGISTRADO",
                "label": "Registrado"
            },
            {
                "value": "ANULADO",
                "label": "Anulado"
            }
        ]
    }
];
