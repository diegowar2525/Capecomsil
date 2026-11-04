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
        "placeholder": "Ej.: Filtro de aceite",
        "label": "Nombre",
        "type": "text",
        "required": true,
        "maxLength": 150
    },
    {
        "name": "unidad_medida",
        "label": "Unidad de inventario",
        "type": "select",
        "required": true,
        "options": [
            { "value": "unidad", "label": "Unidad" },
            { "value": "litro", "label": "Litro" },
            { "value": "galón", "label": "Galón" },
            { "value": "kilogramo", "label": "Kilogramo" },
            { "value": "metro", "label": "Metro" },
            { "value": "envase", "label": "Envase" },
            { "value": "caja", "label": "Caja" },
            { "value": "par", "label": "Par" },
            { "value": "no aplica", "label": "No aplica" }
        ]
    },
    {
        "name": "id_marca",
        "placeholder": "Ej.: Bridgestone",
        "label": "Marca",
        "type": "select",
        "source": "id_marca",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "id_modelo",
        "placeholder": "Ej.: R268",
        "label": "Modelo",
        "type": "select",
        "source": "id_modelo",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "medida",
        "label": "Tamaño o medida",
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
