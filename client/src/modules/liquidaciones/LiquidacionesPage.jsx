import {
    LiquidacionEstado,
    LiquidacionProgreso,
    LiquidacionConfirmacion,
    LiquidacionEstadoDetalle
} from './components/LiquidacionEstado.jsx';
import '../../styles/modules/liquidaciones.css';
import { filters } from './liquidaciones.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { LiquidacionForm } from './components/LiquidacionForm.jsx';
import { fields } from './liquidaciones.fields.js';
import { columns } from './liquidaciones.columns.js';
import { page } from './liquidaciones.config.js';
import { actions as declaredActions } from './liquidaciones.actions.js';
import { api } from './services/liquidaciones.api.js';
import { prepare, prepareAction } from './domain/liquidaciones.js';
import { useLiquidaciones } from './hooks/useLiquidaciones.js';
const names = {
    send: 'enviar',
    confirm: 'confirmar',
    annul: 'anular',
    delete: 'eliminar',
    edit: 'editar'
};
const actions = declaredActions.map((action) => ({
    ...action,
    query: action.id === 'available',
    permission: action.permission ?? `liquidaciones.${names[action.id] ?? 'consultar'}`
}));
const definition = {
    filters,
    fields,
    columns: columns.map((column) =>
        column.key === 'estado'
            ? { ...column, render: (row) => <LiquidacionEstado estado={row.estado} /> }
            : column
    ),
    page,
    actions,
    api,
    prepare,
    prepareAction,
    rowKey: page.rowKey,
    permissionResource: 'liquidaciones',
    renderStateCell: ({ row, open, actions, allowed }) => {
        const action = actions.find((item) => item.id === 'state');
        return (
            <LiquidacionEstado
                estado={row.estado}
                onClick={allowed(action, row) ? () => open(action) : undefined}
            />
        );
    },
    renderReadOnly: ({ action, registro }) =>
        action.id === 'state' ? <LiquidacionEstadoDetalle registro={registro} /> : null,
    renderDetailHeader: (props) => <LiquidacionProgreso {...props} />,
    renderActionSummary: (props) => <LiquidacionConfirmacion {...props} />,
    detailFields: [
        ...fields.filter(
            (field) =>
                !['seleccion_entregas', 'id_detalles_viaje', 'id_gasolinera', 'recargos'].includes(
                    field.name
                )
        ),
        { name: 'valor_transporte', label: 'Transporte' },
        { name: 'retencion', label: 'Retención' },
        { name: 'recargo', label: 'Recargo' },
        { name: 'fecha_generacion', label: 'Creación' },
        { name: 'fecha_envio', label: 'Preparación' },
        { name: 'fecha_confirmacion', label: 'Confirmación' },
        { name: 'fecha_anulacion', label: 'Anulación' }
    ],
    initial: (registro) => ({
        ...registro,
        id_detalles_viaje: registro.detalles?.map((row) => row.id_detalle_viaje) ?? []
    }),
    renderForm: (props) => <LiquidacionForm {...props} />
};
export function LiquidacionesPage() {
    return <CatalogoConectado definition={definition} controller={useLiquidaciones()} />;
}
