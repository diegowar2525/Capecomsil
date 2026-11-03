import { resumirTrabajo } from './domain/historial.js';
export const actions = [
    { id: 'edit', label: 'Editar', states: ['REGISTRADO'] },
    {
        id: 'history', label: 'Historial de cambios', readOnly: true, tables: [{
            name: 'historial', label: 'Modificaciones', rowKey: 'id_historial', columns: [
                { key: 'fecha', label: 'Fecha' }, { key: 'nombre_actor', label: 'Usuario' }, { key: 'version_nueva', label: 'Versión' },
                { key: 'anterior', label: 'Antes', render: row => resumirTrabajo(row.anterior) },
                { key: 'posterior', label: 'Después', render: row => resumirTrabajo(row.posterior) }]
        }]
    },
    {
        id: 'pay', label: 'Registrar pago al taller', states: ['REGISTRADO'], available: row => !row.id_factura_proveedor && !row.pago_directo_automatico, fields: [
            { name: 'fecha', label: 'Fecha del pago', type: 'date', required: true },
            { name: 'monto', label: 'Monto pagado', type: 'number', required: true, min: 0.01, step: 0.01 },
            { name: 'numero_comprobante', label: 'Comprobante (opcional)', maxLength: 100 },
            { name: 'observacion', label: 'Observación (opcional)', type: 'textarea' }]
    },
    {
        "id": "detail",
        "label": "Ver detalle",
        "readOnly": true,
        "tables": [{ name: "cumplimientos", label: "Planes cumplidos por este trabajo", rowKey: "id_cumplimiento_plan_mantenimiento", columns: [{ key: "nombre_plan", label: "Plan realizado" }, { key: "kilometraje_aplicado", label: "Kilometraje del cumplimiento" }] },
        { name: "pagos", label: "Desembolsos al taller", rowKey: "id_gasto", columns: [{ key: "fecha", label: "Fecha" }, { key: "monto", label: "Pagado" }, { key: "id_pago_proveedor", label: "Pago de proveedor" }, { key: "estado", label: "Estado" }] },
        {
            "name": "detalles",
            "label": "Materiales",
            "columns": [
                {
                    "key": "id_producto",
                    "label": "Producto"
                },
                {
                    "key": "descripcion_producto",
                    "label": "Descripción"
                },
                {
                    "key": "cantidad",
                    "label": "Cantidad"
                }
            ]
        }
        ]
    },
    {
        "id": "finish",
        "label": "Finalizar",
        "fields": [
            {
                "name": "fecha_fin",
                "label": "Fecha de finalización",
                "type": "datetime-local",
                "required": true
            },
            {
                "name": "planes_cumplidos",
                "label": "Planes cumplidos",
                "type": "select",
                "required": false,
                "source": "planes_cumplidos",
                "multiple": true
            }
        ],
        "states": [
            "REGISTRADO"
        ],
        "requiresOpen": true
    },
    {
        "id": "fulfill", available: row => row?.clase === "PREVENTIVO",
        "label": "Vincular un plan",
        "fields": [
            {
                "name": "planes_cumplidos",
                "label": "Planes cumplidos",
                "type": "select",
                "required": true,
                "source": "planes_cumplidos",
                "multiple": true
            }
        ],
        "states": [
            "REGISTRADO"
        ],
        "requiresFinished": true
    },
    {
        "id": "annul",
        "label": "Anular",
        "fields": [
            {
                "name": "motivo",
                "label": "Motivo",
                "type": "textarea",
                "required": true,
                "maxLength": 150
            }
        ],
        "states": [
            "REGISTRADO"
        ],
        "message": "La anulación conserva el registro y requiere un motivo."
    }
];
