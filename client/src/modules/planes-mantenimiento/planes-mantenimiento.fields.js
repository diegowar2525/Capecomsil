export const fields = [
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": true,
        "source": "id_vehiculo"
    },
    {
        "name": "nombre",
        "label": "Nombre",
        "type": "text",
        "required": true,
        "maxLength": 150
    },
    {
        "name": "intervalo_km",
        "label": "Intervalo (km)",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "kilometraje_referencia_inicial",
        "label": "Kilometraje de referencia",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "anticipacion_aviso_km",
        "label": "Anticipación del aviso (km)",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "estado",
        "label": "Activo",
        "type": "checkbox",
        "required": false,
        "defaultChecked": true
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
