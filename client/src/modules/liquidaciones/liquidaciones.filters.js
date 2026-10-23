export const filters = [
    {
        "name": "id_gasolinera",
        "label": "Gasolinera",
        "type": "select",
        "required": false,
        "source": "id_gasolinera"
    },
    {
        "name": "periodo_desde",
        "label": "Desde",
        "type": "date",
        "required": false
    },
    {
        "name": "periodo_hasta",
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
