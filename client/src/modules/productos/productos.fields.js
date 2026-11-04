export const fields = [
    {
        "name": "nombre",
        "placeholder": "Ej.: Diésel",
        "label": "Producto transportado",
        "required": true
    },
    {
        "name": "descripcion",
        "label": "Descripción",
        "required": false,
        "type": "textarea"
    },
    {
        "name": "unidad_medida",
        "label": "Unidad de medida",
        "defaultValue": "galón",
        "readOnly": true,
        "required": true
    },
    {
        "name": "estado",
        "label": "Activo",
        "required": false,
        "type": "checkbox",
        "defaultChecked": true
    }
];
