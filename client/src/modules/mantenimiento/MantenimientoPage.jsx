import { filters } from './mantenimiento.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './mantenimiento.fields.js';
import { columns } from './mantenimiento.columns.js';
import { page } from './mantenimiento.config.js';
import { actions as declaredActions } from './mantenimiento.actions.js';
import { api } from './services/mantenimiento.api.js';
import { prepare } from './domain/mantenimiento.js';
import { useMantenimiento } from './hooks/useMantenimiento.js';
const permissions = { annul: 'mantenimientos.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'mantenimientos',  };
export function MantenimientoPage() {
    return <CatalogoConectado definition={definition} controller={useMantenimiento()} />;
}
