import { fields as facturaFields } from '../facturas-proveedores/facturas-proveedores.fields.js';
export const fields = [
    {
        name: 'modalidad_pago', label: 'Forma de registro', type: 'select', required: true, defaultValue: 'DIRECTO', options: [
            { value: 'DIRECTO', label: 'Sin factura' },
            { value: 'NUEVA', label: 'Con factura' }]
    },
    {
        "name": "clase",
        "label": "Clase de trabajo",
        "type": "select",
        "required": true,
        "options": [
            {
                "value": "PREVENTIVO",
                "label": "Mantenimiento preventivo"
            },
            {
                "value": "CORRECTIVO",
                "label": "Correctivo / reparación"
            }
        ]
    },
    {
        "name": "id_vehiculo",
        "label": "Vehículo",
        "type": "select",
        "required": true,
        "source": "id_vehiculo"
    },
    {
        "name": "id_proveedor",
        requiredWhen: { field: 'modalidad_pago', value: 'NUEVA' },
        "label": "Proveedor",
        "type": "select",
        "required": false,
        "source": "id_proveedor"
    },
    {
        "name": "fecha_inicio",
        "label": "Inicio",
        "type": "datetime-local",
        "required": true
    },
    {
        "name": "fecha_fin",
        "label": "Fin",
        "type": "datetime-local",
        "required": false
    },
    {
        "name": "tipo",
        "label": "Trabajo realizado",
        "type": "text",
        "required": true,
        "maxLength": 100
    },
    {
        "name": "monto",
        when: { field: 'modalidad_pago', value: 'DIRECTO' },
        "label": "Total cobrado por el taller",
        "type": "number",
        "required": true,
        "min": 0,
        "step": 0.01
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
    },
    {
        "name": "planes_cumplidos",
        "label": "Planes cumplidos",
        "type": "select",
        "required": false,
        "source": "planes_cumplidos",
        "multiple": true
    },
    {
        "name": "id_factura_proveedor",
        "label": "Factura",
        when: { field: 'modalidad_pago', value: 'EXISTENTE' },
        "type": "select",
        "source": "id_factura_proveedor",
        "required": true
    },
    { name: 'numero_comprobante', label: 'Comprobante del pago (opcional)', maxLength: 100, when: { field: 'modalidad_pago', value: 'DIRECTO' } },
    {
        name: 'factura', label: 'Factura', type: 'group', when: { field: 'modalidad_pago', value: 'NUEVA' },
        fields: facturaFields.filter(field => !['id_proveedor', 'incluir_recepcion_inicial', 'recepcion_inicial'].includes(field.name)).map(field => field.name === 'detalles' ? {...field,fields:field.fields.map(item => item.name === 'descuento' ? {...item,required:false,defaultValue:'0'} : item)} : field)
    }
];
