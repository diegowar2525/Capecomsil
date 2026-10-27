export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true
    },
    {
        "id": "low",
        "label": "Bajo stock",
        "global": true,
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "stock",
                "label": "Productos bajo stock",
                "columns": [
                    {
                        "key": "id_producto",
                        "label": "Producto"
                    },
                    {
                        "key": "nombre",
                        "label": "Nombre"
                    },
                    {
                        "key": "stock_actual",
                        "label": "Existencias"
                    },
                    {
                        "key": "stock_minimo",
                        "label": "Mínimo"
                    },
                    {
                        "key": "unidad_medida",
                        "label": "Unidad"
                    }
                ]
            }
        ]
    },
    {
        "id": "moves",
        "label": "Movimientos",
        "global": true,
        "readOnly": true,
        "fields": [
            {
                "name": "id_producto",
                "label": "Producto",
                "type": "select",
                "required": false,
                "source": "id_producto"
            },
            {
                "name": "fecha_desde",
                "label": "Desde",
                "type": "date",
                "required": true
            },
            {
                "name": "fecha_hasta",
                "label": "Hasta",
                "type": "date",
                "required": true
            },
            {
                "name": "tipo_movimiento",
                "label": "Tipo",
                "type": "select",
                "required": false,
                "options": [
                    {
                        "value": "ENTRADA",
                        "label": "Entrada"
                    },
                    {
                        "value": "SALIDA",
                        "label": "Salida"
                    },
                    {
                        "value": "AJUSTE",
                        "label": "Ajuste"
                    }
                ]
            }
        ],
        "columns": [],
        "tables": [
            {
                "name": "movimientos",
                "label": "Movimientos",
                "columns": [
                    {
                        "key": "id_movimiento",
                        "label": "Código"
                    },
                    {
                        "key": "fecha",
                        "label": "Fecha"
                    },
                    {
                        "key": "id_producto",
                        "label": "Producto"
                    },
                    {
                        "key": "tipo_movimiento",
                        "label": "Tipo"
                    },
                    {
                        "key": "cantidad",
                        "label": "Cantidad"
                    }
                ]
            }
        ]
    },
    {
        "id": "reverse",
        "label": "Revertir ajuste",
        "global": true,
        "fields": [
            {
                "name": "id_movimiento",
                "label": "Código del ajuste (consultar en Movimientos)",
                "type": "number",
                "min": 1,
                "required": true,
                "step": 1
            },
            {
                "name": "motivo",
                "label": "Motivo",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "message": "Seleccione un ajuste original. La reversión conserva su historial."
    }
];
