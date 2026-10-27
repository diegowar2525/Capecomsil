import { filters } from './tarifas.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './tarifas.fields.js';
import { columns } from './tarifas.columns.js';
import { page } from './tarifas.config.js';
import { actions as declaredActions } from './tarifas.actions.js';
import { api } from './services/tarifas.api.js';
import { prepare } from './domain/tarifas.js';
import { useTarifas } from './hooks/useTarifas.js';
const permissions = { annul: 'tarifas.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'tarifas',  };
export function TarifasPage() {
    return <CatalogoConectado definition={definition} controller={useTarifas()} />;
}
