export const fields = [
    {
        "name": "placa",
        "label": "Placa",
        "required": true
    },
    {
        "name": "marca",
        "label": "Marca",
        "required": true
    },
    {
        "name": "modelo",
        "label": "Modelo",
        "required": true
    },
    {
        "name": "anio",
        "label": "Año",
        "required": true,
        "type": "number",
        "min": 1,
        "step": 1
    },
    {
        "name": "capacidad_galones",
        "label": "Capacidad (galones)",
        "required": true,
        "type": "number",
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "kilometraje_base",
        "label": "Kilometraje base",
        "required": false,
        "type": "number",
        "min": 0,
        "step": 0.01
    },
    {
        "name": "fecha_inicio_control_km",
        "label": "Inicio del control de km",
        "required": false,
        "type": "datetime-local"
    },
    {
        "name": "imagen_url",
        "label": "URL de imagen",
        "required": false,
        "type": "url"
    },
    {
        "name": "estado",
        "label": "Activo",
        "required": false,
        "type": "checkbox",
        "defaultChecked": true
    }
];
