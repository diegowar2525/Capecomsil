export const fields = [
    {
        "name": "importe_diario",
        "label": "Importe diario",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "adicional_dia_especial",
        "label": "Adicional por día especial",
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
