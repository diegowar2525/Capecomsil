export const fields = [
    {
        "name": "codigo",
        "label": "Código (no cambia después de crear)",
        "required": true,
        "maxLength": 100
    },
    {
        "name": "nombre",
        "label": "Nombre",
        "required": true,
        "maxLength": 100
    },
    {
        "name": "descripcion",
        "label": "Descripción",
        "type": "textarea"
    },
    {
        "name": "estado",
        "label": "Activo",
        "type": "checkbox",
        "defaultChecked": true
    }
];
