export const fields = [
    {
        "name": "id_trayecto",
        "label": "Trayecto",
        "type": "select",
        "required": true,
        "source": "id_trayecto"
    },
    {
        "name": "importe",
        "label": "Importe",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "fecha_inicio",
        "label": "Inicio de vigencia",
        "type": "date",
        "required": true
    },
    {
        "name": "fecha_fin",
        "label": "Fin de vigencia",
        "type": "date",
        "required": false
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
