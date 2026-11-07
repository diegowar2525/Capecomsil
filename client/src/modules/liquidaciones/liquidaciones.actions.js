import { recargosField } from './liquidaciones.fields.js';
import { fields as facturaFields } from '../facturacion/facturacion.fields.js';
export const actions = [
    { id: 'state', label: 'Estado de la liquidación', placement: 'state', readOnly: true },
    { id: 'reopen', label: 'Volver a borrador', parent: 'state', direct: true, direction: 'back', states: ['PREPARADA'], permission: 'liquidaciones.editar', message: 'Se habilitará la edición. Las entregas seguirán reservadas y el cambio quedará en el historial.' },
    { id: 'invoice', label: 'Registrar factura externa', states: ['CONFIRMADA'], permission: 'facturas_cliente.crear', message: 'Registre el documento emitido por otro medio. Los importes se tomarán de esta liquidación.', fields: facturaFields.filter(field => field.name !== 'id_liquidacion') },
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [
            { name: "recargos", label: "Recargos", columns: [{ key: "concepto", label: "Concepto" }, { key: "importe", label: "Importe" }, { key: "id_viaje", label: "Viaje anulado" }] },
            { name: "facturas", label: "Facturas asociadas", rowKey: "id_factura", columns: [{ key: "numero_factura", label: "Factura" }, { key: "valor_neto", label: "Facturado" }, { key: "total_cobrado", label: "Cobrado" }, { key: "saldo", label: "Saldo" }, { key: "estado", label: "Estado" }] },
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
            recargosField,
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
        "label": "Marcar como preparada",
        "shortLabel": "Preparar",
        "parent": "state",
        "direct": true,
        "direction": "forward",
        "states": [
            "BORRADOR"
        ],
        "message": "La liquidación quedará preparada para revisión y no podrá editarse."
    },
    {
        "id": "confirm",
        "label": "Confirmar",
        "parent": "state",
        "direct": true,
        "direction": "forward",
        "states": [
            "PREPARADA"
        ],
        "message": "Confirmar los valores de la liquidación preparada."
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
            "PREPARADA",
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
