export const fields = [
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
        "name": "seleccion_entregas",
        "label": "Selección de entregas",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "AUTOMATICA",
                "label": "Automatica"
            },
            {
                "value": "MANUAL",
                "label": "Manual"
            }
        ],
        "defaultValue": "AUTOMATICA"
    },
    {
        "name": "id_detalles_viaje",
        "label": "Entregas disponibles",
        "type": "select",
        "required": true,
        "source": "id_detalles_viaje",
        "multiple": true,
        "when": {
            "field": "seleccion_entregas",
            "value": "MANUAL"
        }
    }
];
