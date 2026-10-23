export const filters = [
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": false,
        "source": "id_vehiculo"
    },
    {
        "name": "situacion",
        "label": "Situación",
        "type": "select",
        "required": false,
        "options": [
            {
                "value": "AL_DIA",
                "label": "Al dia"
            },
            {
                "value": "PROXIMO",
                "label": "Proximo"
            },
            {
                "value": "VENCIDO",
                "label": "Vencido"
            },
            {
                "value": "INACTIVO",
                "label": "Inactivo"
            },
            {
                "value": "SIN_CONFIGURAR",
                "label": "Sin configurar"
            }
        ]
    }
];
