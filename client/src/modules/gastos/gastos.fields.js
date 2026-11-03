export const fields = [
    {
        "name": "origen",
        "label": "¿Qué deseas registrar?",
        "type": "select",
        "required": true,
        "defaultValue": "OPERATIVO",
        "options": [
            {
                "value": "OPERATIVO",
                "label": "Gasto operativo"
            },
            {
                "value": "VIATICO",
                "label": "Desembolso de viático"
            }
        ]
    },
    {
        "name": "fecha",
        "label": "Fecha del desembolso",
        "type": "date",
        "required": true
    },
    {
        "name": "id_tipo_gasto",
        "label": "Tipo de gasto operativo",
        "type": "select",
        "source": "id_tipo_gasto",
        "required": true,
        "maxLength": 100,
        "when": {
            "field": "origen",
            "value": "OPERATIVO"
        }
    },
    {
        "name": "monto",
        "label": "Monto desembolsado",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": false,
        "source": "id_vehiculo",
        "when": {
            "field": "origen",
            "value": "OPERATIVO"
        }
    },
    {
        "name": "id_viaje",
        "label": "Viaje",
        "type": "select",
        "required": false,
        "source": "id_viaje",
        "when": {
            "field": "origen",
            "value": "OPERATIVO"
        }
    },
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "id_viatico_chofer",
        "when": {
            "field": "origen",
            "value": "VIATICO"
        },
        "label": "Viático diario",
        "type": "select",
        "required": true,
        "source": "id_viatico_chofer"
    },
    {
        "name": "numero_comprobante",
        "label": "Comprobante",
        "type": "text",
        "required": false,
        "maxLength": 100
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
    }
];
