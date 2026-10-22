export const fields = [
    {
        "name": "nombre",
        "label": "Nombre",
        "required": true
    },
    {
        "name": "cedula",
        "label": "Cédula",
        "required": true
    },
    {
        "name": "telefono",
        "label": "Teléfono",
        "required": false,
        "type": "tel"
    },
    {
        "name": "tipo_remuneracion",
        "label": "Tipo de remuneración",
        "required": true,
        "type": "select",
        "options": [
            {
                "value": "DIARIO_FIJO",
                "label": "Diario fijo"
            },
            {
                "value": "DIA_TRABAJADO",
                "label": "Día trabajado"
            }
        ]
    },
    {
        "name": "imagen_url",
        "label": "URL de imagen",
        "required": false,
        "type": "url"
    },
    {
        "name": "estado",
        "label": "Activo",
        "required": false,
        "type": "checkbox",
        "defaultChecked": true
    }
];
