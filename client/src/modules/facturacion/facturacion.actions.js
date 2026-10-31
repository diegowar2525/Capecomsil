import { fields as cobroFields } from '../pagos/pagos.fields.js';
export const actions = [
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            {
                "name": "cobros",
                "label": "Historial de cobros",
                "rowKey": "id_pago",
                "columns": [
                    {
                        "key": "id_pago",
                        "label": "ID"
                    },
                    {
                        "key": "numero_factura",
                        "label": "Factura"
                    },
                    {
                        "key": "nombre_gasolinera",
                        "label": "Gasolinera"
                    },
                    {
                        "key": "fecha_pago",
                        "label": "Fecha"
                    },
                    {
                        "key": "monto",
                        "label": "Monto"
                    },
                    {
                        "key": "forma_pago",
                        "label": "Forma de pago"
                    },
                    {
                        "key": "estado",
                        "label": "Estado"
                    }
                ]
            },
            {
                "name": "entregas",
                "label": "Entregas facturadas",
                "rowKey": "id_detalle_liquidacion",
                "columns": [
                    {
                        "key": "id_detalle_viaje",
                        "label": "Entrega"
                    },
                    {
                        "key": "galones",
                        "label": "Galones"
                    },
                    {
                        "key": "tarifa_aplicada",
                        "label": "Tarifa"
                    },
                    {
                        "key": "valor_transporte",
                        "label": "Importe"
                    }
                ]
            }
        ]
    },
    {
        "id": "annul",
        "label": "Anular",
        "states": [
            "REGISTRADA"
        ],
        "fields": [
            {
                "name": "motivo",
                "label": "Motivo de anulación",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "message": "Solo puede anularse si no tiene cobros vigentes. Esto registra la anulación interna; gestione también el documento en el sistema emisor."
    },
    { id: 'collect', label: 'Registrar cobro', states: ['REGISTRADA'], permission: 'cobros_cliente.crear', available: row => Number(row.saldo) > 0, fields: cobroFields.filter(field => field.name !== 'id_factura') }
];
