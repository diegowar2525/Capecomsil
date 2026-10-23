export const fields = [
    {
        "name": "id_producto",
        "label": "Producto",
        "type": "select",
        "required": true,
        "source": "id_producto"
    },
    {
        "name": "fecha",
        "label": "Fecha",
        "type": "date",
        "required": true
    },
    {
        "name": "cantidad",
        "label": "Cantidad del ajuste",
        "type": "number",
        "required": true,
        "step": 0.01
    },
    {
        "name": "motivo",
        "label": "Motivo",
        "type": "textarea",
        "required": true,
        "maxLength": 150
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
