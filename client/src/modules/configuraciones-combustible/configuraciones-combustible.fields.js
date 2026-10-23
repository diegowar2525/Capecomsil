export const fields = [
    {
        "name": "consumo_galones_km",
        "label": "Consumo (galones/km)",
        "type": "number",
        "required": true,
        "min": 1e-06,
        "step": 1e-06
    },
    {
        "name": "precio_por_galon",
        "label": "Precio por galón",
        "type": "number",
        "required": true,
        "min": 0.0001,
        "step": 0.0001
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
