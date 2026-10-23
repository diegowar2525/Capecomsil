export const fields = [
    {
        "name": "id_gasolinera",
        "label": "Gasolinera",
        "type": "select",
        "required": true,
        "source": "id_gasolinera"
    },
    {
        "name": "modalidad",
        "label": "Modalidad",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "POR_TERMINAL",
                "label": "Por terminal de carga"
            },
            {
                "value": "POR_CAPACIDAD",
                "label": "Por capacidad del vehículo"
            }
        ]
    },
    {
        "name": "fecha_inicio",
        "label": "Vigente desde",
        "type": "date",
        "required": true
    }
];

