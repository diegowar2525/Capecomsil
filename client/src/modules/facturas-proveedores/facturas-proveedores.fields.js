export const fields = [
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": true,
        "source": "id_proveedor"
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
        "label": "Emisión",
        "type": "date",
        "required": true
    },
    {
        "name": "fecha_vencimiento",
        "label": "Vencimiento",
        "type": "date",
        "required": false
    },
    {
        "name": "detalles",
        "label": "Conceptos",
        "type": "rows",
        "fields": [
            {
                "name": "tipo_concepto",
                "label": "Tipo",
                "type": "select",
                "required": true,
                "options": [
                    {
                        "value": "PRODUCTO",
                        "label": "Producto"
                    },
                    {
                        "value": "SERVICIO",
                        "label": "Servicio"
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
                    "field": "tipo_concepto",
                    "value": "PRODUCTO"
                }
            },
            {
                "name": "descripcion",
                "label": "Descripción",
                "type": "text",
                "required": true
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
                "name": "precio_unitario",
                "label": "Precio unitario",
                "type": "number",
                "required": true,
                "min": 0,
                "step": 0.01
            },
            {
                "name": "descuento",
                "label": "Descuento",
                "type": "number",
                "required": true,
                "min": 0,
                "step": 0.01
            },
            {
                "name": "porcentaje_impuesto",
                "label": "Impuesto (%)",
                "type": "number",
                "required": true,
                "min": 0,
                "step": 0.0001,
                "max": 100
            }
        ],
        "minRows": 1
    },
    {
        "name": "incluir_recepcion_inicial",
        "label": "Registrar recepción inicial",
        "type": "checkbox"
    },
    {
        "name": "recepcion_inicial",
        "label": "Recepción inicial",
        "type": "group",
        "minRows": 1,
        "when": {
            "field": "incluir_recepcion_inicial",
            "value": true
        },
        "fields": [
            {
                "name": "fecha_recepcion",
                "label": "Fecha de recepción",
                "type": "date",
                "required": true
            },
            {
                "name": "detalles",
                "label": "Líneas de producto recibidas",
                "type": "rows",
                "fields": [
                    {
                        "name": "numero_detalle",
                        "label": "Número de línea de la factura",
                        "type": "number",
                        "required": true,
                        "min": 1,
                        "step": 1
                    },
                    {
                        "name": "cantidad_recibida",
                        "label": "Cantidad recibida",
                        "type": "number",
                        "required": true,
                        "min": 0.01,
                        "step": 0.01
                    }
                ]
            }
        ]
    }
];
