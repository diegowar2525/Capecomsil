export const relatedAction = {
    "id": "kilometraje",
    "label": "Consultar kilometraje",
    "readOnly": true,
    "fields": [
        {
            "name": "fecha_hasta",
            "label": "Fecha de corte",
            "type": "datetime-local",
            "step": 1
        }
    ],
    "columns": [
        {
            "key": "placa",
            "label": "Placa"
        },
        {
            "key": "kilometraje_base",
            "label": "Kilometraje base"
        },
        {
            "key": "kilometros_acumulados",
            "label": "Acumulado"
        },
        {
            "key": "kilometraje_estimado",
            "label": "Kilometraje estimado"
        },
        {
            "key": "fecha_corte",
            "label": "Corte"
        },
        {
            "key": "estado_control",
            "label": "Control"
        }
    ]
};
