import { GastoForm } from './components/GastoForm.jsx';
import { filters } from './gastos.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './gastos.fields.js';
import { columns } from './gastos.columns.js';
import { page } from './gastos.config.js';
import { actions as declaredActions } from './gastos.actions.js';
import { api } from './services/gastos.api.js';
import { prepare } from './domain/gastos.js';
import { useGastos } from './hooks/useGastos.js';
const permissions = { annul: 'gastos.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { renderForm: props => <GastoForm {...props} />, filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'gastos',  };
export function GastosPage() {
    return <CatalogoConectado definition={definition} controller={useGastos()} />;
}
