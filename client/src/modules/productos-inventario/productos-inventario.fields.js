export const fields = [
    {
        "name": "id_categoria",
        "label": "Categoría",
        "type": "select",
        "required": true,
        "source": "id_categoria"
    },
    {
        "name": "nombre",
        "label": "Nombre",
        "type": "text",
        "required": true,
        "maxLength": 150
    },
    {
        "name": "unidad_medida",
        "label": "Unidad de medida",
        "type": "text",
        "required": true,
        "maxLength": 30
    },
    {
        "name": "marca",
        "label": "Marca",
        "type": "text",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "modelo",
        "label": "Modelo",
        "type": "text",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "medida",
        "label": "Medida",
        "type": "text",
        "required": false,
        "maxLength": 50
    },
    {
        "name": "condicion_llanta",
        "label": "Condición (solo llantas)",
        "type": "select",
        "required": false,
        "options": [
            {
                "value": "NUEVA",
                "label": "Nueva"
            },
            {
                "value": "REENCAUCHADA",
                "label": "Reencauchada"
            }
        ]
    },
    {
        "name": "stock_minimo",
        "label": "Stock mínimo",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "imagen_url",
        "label": "Imagen",
        "type": "url",
        "required": false
    },
    {
        "name": "descripcion",
        "label": "Descripción",
        "type": "textarea",
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
