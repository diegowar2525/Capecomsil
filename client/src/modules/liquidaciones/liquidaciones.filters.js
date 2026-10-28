export const filters = [
    {
        "name": "id_gasolinera",
        "label": "Gasolinera",
        "type": "select",
        "required": false,
        "labelKey": "nombre_gasolinera"
    },
    {
        "name": "periodo_desde", "field": "periodo_fin", "operator": "from",
        "label": "Desde",
        "type": "date",
        "required": false
    },
    {
        "name": "periodo_hasta", "field": "periodo_inicio", "operator": "to",
        "label": "Hasta",
        "type": "date",
        "required": false
    },
    {
        "name": "estado",
        "label": "Estado",
        "type": "select",
        "required": false,
        "options": [
            {
                "value": "BORRADOR",
                "label": "Borrador"
            },
            {
                "value": "ENVIADA",
                "label": "Enviada"
            },
            {
                "value": "CONFIRMADA",
                "label": "Confirmada"
            },
            {
                "value": "ANULADA",
                "label": "Anulada"
            }
        ]
    }
];
