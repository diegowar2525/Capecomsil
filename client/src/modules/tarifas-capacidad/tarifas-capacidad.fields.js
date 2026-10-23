export const fields = [
    {
        "name": "id_gasolinera",
        "label": "Gasolinera",
        "type": "select",
        "required": true,
        "source": "id_gasolinera"
    },
    {
        "name": "capacidad_galones",
        "label": "Capacidad del vehículo (galones)",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "4000",
                "label": "4.000"
            },
            {
                "value": "6000",
                "label": "6.000"
            },
            {
                "value": "8000",
                "label": "8.000"
            },
            {
                "value": "10000",
                "label": "10.000"
            }
        ]
    },
    {
        "name": "valor_por_galon",
        "label": "Valor por galón",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.0001
    },
    {
        "name": "fecha_inicio",
        "label": "Inicio de vigencia",
        "type": "date",
        "required": true
    },
    {
        "name": "fecha_fin",
        "label": "Fin de vigencia",
        "type": "date"
    },
    {
        "name": "estado",
        "label": "Activo",
        "type": "checkbox",
        "defaultChecked": true
    }
];

