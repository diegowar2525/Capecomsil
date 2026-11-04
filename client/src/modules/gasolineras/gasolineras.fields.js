export const fields = [
    { name: 'id_provincia', label: 'Provincia', type: 'select', source: 'id_provincia' },
    { name: 'id_ciudad', label: 'Ciudad', type: 'select', source: 'id_ciudad' },
    {
        "name": "nombre",
        "placeholder": "Ej.: Estación de servicio Central",
        "label": "Gasolinera",
        "required": true
    },
    {
        "name": "ruc",
        "label": "RUC",
        "required": true
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
        "name": "representante_legal",
        "label": "Representante legal",
        "required": false
    },
    {
        "name": "agente_retencion",
        "label": "Agente de retención",
        "required": false,
        "type": "checkbox",
        "defaultChecked": false
    },
    {
        "name": "estado",
        "label": "Activo",
        "required": false,
        "type": "checkbox",
        "defaultChecked": true
    }
];
