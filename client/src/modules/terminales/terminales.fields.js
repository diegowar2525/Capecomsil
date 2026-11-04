export const fields = [
    { name: 'id_provincia', label: 'Provincia', type: 'select', source: 'id_provincia' },
    { name: 'id_ciudad', label: 'Ciudad', type: 'select', source: 'id_ciudad' },
    {
        "name": "nombre",
        "placeholder": "Ej.: Terminal La Troncal",
        "label": "Terminal",
        "required": true
    },
    {
        "name": "ubicacion",
        "label": "Ubicación",
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
