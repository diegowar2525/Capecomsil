import { MantenimientoForm } from './components/MantenimientoForm.jsx';
import { filters } from './mantenimiento.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './mantenimiento.fields.js';
import { columns } from './mantenimiento.columns.js';
import { page } from './mantenimiento.config.js';
import { actions as declaredActions } from './mantenimiento.actions.js';
import { api } from './services/mantenimiento.api.js';
import { prepare, initial } from './domain/mantenimiento.js';
import { useMantenimiento } from './hooks/useMantenimiento.js';

const permissions = {
    history: 'mantenimientos.historial',
    pay: 'mantenimientos.pagar',
    annul: 'mantenimientos.anular',
    finish: 'mantenimientos.finalizar',
    fulfill: 'mantenimientos.registrar_cumplimientos',
    payments: 'pagos_proveedor.consultar',
    receipts: 'recepciones.consultar',
    pending: 'recepciones.consultar',
    receive: 'recepciones.crear'
};

const actions = declaredActions.map((action) => ({
    ...action,
    permission: permissions[action.id] ?? action.permission
}));

const detailFields = [
    ...fields
        .filter((field) => !['planes_cumplidos', 'factura'].includes(field.name))
        .map((field) =>
            field.name === 'modalidad_pago'
                ? {
                      ...field,
                      options: [
                          { value: 'DIRECTO', label: 'Sin factura' },
                          { value: 'EXISTENTE', label: 'Con factura' },
                          { value: 'NUEVA', label: 'Con factura' }
                      ]
                  }
                : field
        ),
    { name: 'total_pagado', label: 'Total pagado' },
    { name: 'saldo_pendiente', label: 'Saldo pendiente' }
];

const definition = {
    initial,
    renderForm: (props) => <MantenimientoForm {...props} fields={fields} />,
    renderActionForm: (props) => <MantenimientoForm {...props} />,
    detailFields,
    formMessage:
        'Los productos propios se descuentan desde Movimientos de inventario. Los materiales externos se detallan en la factura. Con factura, registra los abonos desde Pagos a proveedores. Sin factura, el gasto se genera al guardar el trabajo.',
    filters,
    fields,
    columns,
    page,
    actions,
    api,
    prepare,
    rowKey: page.rowKey,
    permissionResource: 'mantenimientos'
};

export function MantenimientoPage() {
    return <CatalogoConectado definition={definition} controller={useMantenimiento()} />;
}
