export const fields = [
    {
        "name": "id_gasolinera",
        "label": "Gasolinera",
        "type": "select",
        "required": true,
        "source": "id_gasolinera"
    },
    {
        "name": "id_terminal",
        "label": "Terminal",
        "type": "select",
        "required": true,
        "source": "id_terminal"
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
        "type": "date",
        "required": false
    },
    {
        "name": "estado",
        "label": "Activo",
        "type": "checkbox",
        "required": false,
        "defaultChecked": true
    }
];
