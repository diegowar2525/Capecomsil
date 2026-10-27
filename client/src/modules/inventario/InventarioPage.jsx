import { filters } from './inventario.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './inventario.fields.js';
import { columns } from './inventario.columns.js';
import { page } from './inventario.config.js';
import { actions as declaredActions } from './inventario.actions.js';
import { api } from './services/inventario.api.js';
import { prepare } from './domain/inventario.js';
import { useInventario } from './hooks/useInventario.js';
const actions = declaredActions.map(action => ({ ...action, query: Boolean(action.readOnly && action.global), permission: action.id === 'reverse' ? 'inventario.revertir' : action.id === 'annul' ? 'inventario.anular' : 'inventario.consultar' }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'inventario', createPermission: 'inventario.ajustar', };
export function InventarioPage() { return <CatalogoConectado definition={definition} controller={useInventario()} />; }
