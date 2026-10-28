export const fields = [
    {
        "name": "fecha",
        "label": "Fecha",
        "type": "date",
        "required": true
    },
    {
        "name": "tipo_gasto",
        "label": "Tipo de gasto",
        "type": "select",
        "source": "tipo_gasto",
        "required": true,
        "maxLength": 100
    },
    {
        "name": "monto",
        "label": "Monto",
        "type": "number",
        "required": true,
        "min": 0.01,
        "step": 0.01
    },
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": false,
        "source": "id_vehiculo"
    },
    {
        "name": "id_viaje",
        "label": "Viaje",
        "type": "select",
        "required": false,
        "source": "id_viaje"
    },
    {
        "name": "id_proveedor",
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "id_viatico_chofer",
        "when": {"field":"tipo_gasto","value":"VIATICO"},
        "label": "Viático diario",
        "type": "select",
        "required": false,
        "source": "id_viatico_chofer"
    },
    {
        "name": "numero_comprobante",
        "label": "Comprobante",
        "type": "text",
        "required": false,
        "maxLength": 100
    },
    {
        "name": "descripcion",
        "label": "Descripción",
        "type": "textarea",
        "required": false
    },
    {
        "name": "observacion",
        "label": "Observación",
        "type": "textarea",
        "required": false
    }
];
