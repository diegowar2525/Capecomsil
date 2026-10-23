export const relatedAction = {
    "id": "cuentas",
    "label": "Cuentas por pagar",
    "readOnly": true,
    "columns": [],
    "tables": [
        {
            "name": "cuentas_por_pagar",
            "label": "Facturas pendientes",
            "columns": [
                {
                    "key": "numero_factura",
                    "label": "Factura"
                },
                {
                    "key": "fecha_vencimiento",
                    "label": "Vencimiento"
                },
                {
                    "key": "total",
                    "label": "Total"
                },
                {
                    "key": "total_pagado",
                    "label": "Pagado"
                },
                {
                    "key": "saldo_pendiente",
                    "label": "Saldo"
                }
            ]
        }
    ]
};
