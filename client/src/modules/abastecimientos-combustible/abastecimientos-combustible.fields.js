export const fields = [
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": true,
        "source": "id_vehiculo"
    },
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "fecha_hora",
        "label": "Fecha y hora",
        "type": "datetime-local",
        "required": true
    },
    {
        "name": "kilometraje_odometro",
        "label": "Odómetro",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
    },
    {
        "name": "galones",
        "label": "Galones",
        "type": "number",
        "required": true,
        "min": 0.0001,
        "step": 0.0001
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
        "name": "tanque_lleno",
        "label": "Tanque lleno",
        "type": "checkbox",
        "required": false
    },
    {
        "name": "numero_comprobante",
        "label": "Comprobante",
        "type": "text",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
