export const fields = [
    {
        "name": "nombre",
        "label": "Proveedor",
        "required": true
    },
    {
        "name": "ruc",
        "label": "RUC",
        "required": false
    },
    {
        "name": "direccion",
        "label": "Dirección",
        "required": false
    },
    {
        "name": "telefono",
        "label": "Teléfono",
        "required": false,
        "type": "tel"
    },
    {
        "name": "correo",
        "label": "Correo",
        "required": false,
        "type": "email"
    },
    {
        "name": "estado",
        "label": "Activo",
        "required": false,
        "type": "checkbox",
        "defaultChecked": true
    }
];
