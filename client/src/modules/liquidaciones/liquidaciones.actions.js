import { fields as facturaFields } from '../facturacion/facturacion.fields.js';
export const actions = [
    { id: 'invoice', label: 'Registrar factura externa', states: ['CONFIRMADA'], permission: 'facturas_cliente.crear', message: 'Registre el documento emitido por otro medio. Los importes se tomarán de esta liquidación.', fields: facturaFields.filter(field => field.name !== 'id_liquidacion') },
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            { name: "facturas", label: "Facturas asociadas", rowKey: "id_factura", columns: [{key:"numero_factura",label:"Factura"},{key:"valor_neto",label:"Facturado"},{key:"total_cobrado",label:"Cobrado"},{key:"saldo",label:"Saldo"},{key:"estado",label:"Estado"}] },
            {
                "name": "detalles",
                "label": "Entregas",
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
        "id": "edit",
        "label": "Editar borrador",
        "fields": [
            {
                "name": "id_gasolinera",
                "label": "Gasolinera",
                "type": "select",
                "required": true,
                "source": "id_gasolinera"
            },
            {
                "name": "periodo_inicio",
                "label": "Inicio del período",
                "type": "date",
                "required": true
            },
            {
                "name": "periodo_fin",
                "label": "Fin del período",
                "type": "date",
                "required": true
            },
            {
                "name": "observacion",
                "label": "Observación",
                "type": "textarea",
                "required": false
            },
            {
                "name": "id_detalles_viaje",
                "label": "Entregas incluidas",
                "type": "select",
                "required": false,
                "source": "id_detalles_viaje",
                "multiple": true
            }
        ],
        "states": [
            "BORRADOR"
        ]
    },
    {
        "id": "send",
        "label": "Enviar",
        "states": [
            "BORRADOR"
        ],
        "message": "Registrar el estado ENVIADA; no envía correos."
    },
    {
        "id": "confirm",
        "label": "Confirmar",
        "states": [
            "ENVIADA"
        ],
        "message": "Confirmar los valores de la liquidación enviada."
    },
    {
        "id": "annul",
        "label": "Anular",
        "fields": [
            {
                "name": "motivo",
                "label": "Motivo",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "states": [
            "ENVIADA",
            "CONFIRMADA"
        ],
        "message": "La anulación conserva el registro y requiere un motivo."
    },
    {
        "id": "delete",
        "label": "Eliminar borrador",
        "states": [
            "BORRADOR"
        ],
        "message": "Eliminar el borrador seleccionado."
    },
    {
        "id": "available",
        "label": "Consultar entregas disponibles",
        "global": true,
        "fields": [
            {
                "name": "id_gasolinera",
                "label": "Gasolinera",
                "type": "select",
                "required": true,
                "source": "id_gasolinera"
            },
            {
                "name": "periodo_inicio",
                "label": "Inicio del período",
                "type": "date",
                "required": true
            },
            {
                "name": "periodo_fin",
                "label": "Fin del período",
                "type": "date",
                "required": true
            }
        ],
        "readOnly": true,
        "columns": [],
        "tables": [
            {
                "name": "entregas",
                "label": "Entregas disponibles",
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
                        "key": "valor_transporte",
                        "label": "Importe"
                    }
                ]
            }
        ]
    }
];
