import { filters } from './pagos-proveedores.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './pagos-proveedores.fields.js';
import { columns } from './pagos-proveedores.columns.js';
import { page } from './pagos-proveedores.config.js';
import { actions as declaredActions } from './pagos-proveedores.actions.js';
import { api } from './services/pagos-proveedores.api.js';
import { prepare } from './domain/pagos-proveedores.js';
import { usePagosProveedores } from './hooks/usePagosProveedores.js';
const permissions = { annul: 'pagos_proveedor.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'pagos_proveedor',  };
export function PagosProveedoresPage() {
    return <CatalogoConectado definition={definition} controller={usePagosProveedores()} />;
}
