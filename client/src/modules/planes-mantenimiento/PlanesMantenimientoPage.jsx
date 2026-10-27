import { filters } from './planes-mantenimiento.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './planes-mantenimiento.fields.js';
import { columns } from './planes-mantenimiento.columns.js';
import { page } from './planes-mantenimiento.config.js';
import { actions as declaredActions } from './planes-mantenimiento.actions.js';
import { api } from './services/planes-mantenimiento.api.js';
import { prepare } from './domain/planes-mantenimiento.js';
import { usePlanesMantenimiento } from './hooks/usePlanesMantenimiento.js';
const permissions = { annul: 'planes_mantenimiento.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'planes_mantenimiento',  };
export function PlanesMantenimientoPage() {
    return <CatalogoConectado definition={definition} controller={usePlanesMantenimiento()} />;
}
