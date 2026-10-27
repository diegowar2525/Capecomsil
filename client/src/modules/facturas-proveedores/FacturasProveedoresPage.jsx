import { filters } from './facturas-proveedores.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './facturas-proveedores.fields.js';
import { columns } from './facturas-proveedores.columns.js';
import { page } from './facturas-proveedores.config.js';
import { actions as declaredActions } from './facturas-proveedores.actions.js';
import { api } from './services/facturas-proveedores.api.js';
import { prepare } from './domain/facturas-proveedores.js';
import { useFacturasProveedores } from './hooks/useFacturasProveedores.js';
const permissions = { annul: 'compras.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'compras',  };
export function FacturasProveedoresPage() {
    return <CatalogoConectado definition={definition} controller={useFacturasProveedores()} />;
}
