import { filters } from './abastecimientos-combustible.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './abastecimientos-combustible.fields.js';
import { columns } from './abastecimientos-combustible.columns.js';
import { page } from './abastecimientos-combustible.config.js';
import { actions as declaredActions } from './abastecimientos-combustible.actions.js';
import { api } from './services/abastecimientos-combustible.api.js';
import { prepare } from './domain/abastecimientos-combustible.js';
import { useAbastecimientos } from './hooks/useAbastecimientos.js';
const permissions = { annul: 'abastecimientos.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'abastecimientos',  };
export function AbastecimientosPage() {
    return <CatalogoConectado definition={definition} controller={useAbastecimientos()} />;
}
