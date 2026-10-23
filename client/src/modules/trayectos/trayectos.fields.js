export const fields = [
    {
        "name": "nombre",
        "label": "Nombre",
        "type": "text",
        "required": true,
        "maxLength": 150
    },
    {
        "name": "tipo_origen",
        "label": "Tipo de origen",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "TERMINAL",
                "label": "Terminal"
            },
            {
                "value": "GASOLINERA",
                "label": "Gasolinera"
            }
        ]
    },
    {
        "name": "id_terminal_origen",
        "label": "Terminal de origen",
        "type": "select",
        "required": true,
        "source": "id_terminal_origen",
        "when": {
            "field": "tipo_origen",
            "value": "TERMINAL"
        }
    },
    {
        "name": "id_gasolinera_origen",
        "label": "Gasolinera de origen",
        "type": "select",
        "required": true,
        "source": "id_gasolinera_origen",
        "when": {
            "field": "tipo_origen",
            "value": "GASOLINERA"
        }
    },
    {
        "name": "tipo_destino",
        "label": "Tipo de destino",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "TERMINAL",
                "label": "Terminal"
            },
            {
                "value": "GASOLINERA",
                "label": "Gasolinera"
            }
        ]
    },
    {
        "name": "id_terminal_destino",
        "label": "Terminal de destino",
        "type": "select",
        "required": true,
        "source": "id_terminal_destino",
        "when": {
            "field": "tipo_destino",
            "value": "TERMINAL"
        }
    },
    {
        "name": "id_gasolinera_destino",
        "label": "Gasolinera de destino",
        "type": "select",
        "required": true,
        "source": "id_gasolinera_destino",
        "when": {
            "field": "tipo_destino",
            "value": "GASOLINERA"
        }
    },
    {
        "name": "kilometros",
        "label": "Kilómetros",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "estado",
        "label": "Activo",
        "type": "checkbox",
        "required": false,
        "defaultChecked": true
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
