export const fields = [
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": true,
        "source": "id_vehiculo"
    },
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "fecha_inicio",
        "label": "Inicio",
        "type": "datetime-local",
        "required": true
    },
    {
        "name": "fecha_fin",
        "label": "Fin",
        "type": "datetime-local",
        "required": false
    },
    {
        "name": "tipo",
        "label": "Tipo",
        "type": "text",
        "required": true,
        "maxLength": 100
    },
    {
        "name": "monto",
        "label": "Monto",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "descripcion",
        "label": "Descripción",
        "type": "textarea",
        "required": false
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    },
    {
        "name": "detalles",
        "label": "Materiales",
        "type": "rows",
        "fields": [
            {
                "name": "origen_producto",
                "label": "Origen",
                "type": "select",
                "required": true,
                "options": [
                    {
                        "value": "INVENTARIO",
                        "label": "Inventario"
                    },
                    {
                        "value": "EXTERNO",
                        "label": "Externo"
                    }
                ]
            },
            {
                "name": "id_producto",
                "label": "Producto",
                "type": "select",
                "required": true,
                "source": "id_producto",
                "when": {
                    "field": "origen_producto",
                    "value": "INVENTARIO"
                }
            },
            {
                "name": "descripcion_producto",
                "label": "Material externo",
                "type": "text",
                "required": true,
                "when": {
                    "field": "origen_producto",
                    "value": "EXTERNO"
                }
            },
            {
                "name": "cantidad",
                "label": "Cantidad",
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
        "minRows": 0
    },
    {
        "name": "planes_cumplidos",
        "label": "Planes cumplidos",
        "type": "select",
        "required": false,
        "source": "planes_cumplidos",
        "multiple": true
    }
];
