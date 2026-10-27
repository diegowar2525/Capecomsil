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
const names = { send: 'enviar', confirm: 'confirmar', annul: 'anular', delete: 'eliminar', edit: 'editar' };
const actions = declaredActions.map(action => ({ ...action, query: action.id === 'available', permission: `liquidaciones.${names[action.id] ?? 'consultar'}` }));
const definition = { filters, fields, columns, page, actions, api, prepare, prepareAction, rowKey: page.rowKey, permissionResource: 'liquidaciones',
 initial: registro => ({ ...registro, id_detalles_viaje: registro.detalles?.map(row => row.id_detalle_viaje) ?? [] }),
 renderForm: props => <LiquidacionForm {...props} /> };
export function LiquidacionesPage() { return <CatalogoConectado definition={definition} controller={useLiquidaciones()} />; }
