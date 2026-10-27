import { filters } from './remuneraciones-chofer.filters.js';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import { fields } from './remuneraciones-chofer.fields.js';
import { columns } from './remuneraciones-chofer.columns.js';
import { page } from './remuneraciones-chofer.config.js';
import { actions as declaredActions } from './remuneraciones-chofer.actions.js';
import { api } from './services/remuneraciones-chofer.api.js';
import { prepare } from './domain/remuneraciones-chofer.js';
const actions = declaredActions.map(action => ({ ...action, query: Boolean(action.readOnly && action.global), permission: action.id === 'reverse' ? 'inventario.revertir' : action.id === 'annul' ? 'remuneraciones.anular' : 'remuneraciones.consultar' }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'remuneraciones', createPermission: 'remuneraciones.generar', };
export function RemuneracionesPage() { return <ConsultaCatalogo definition={definition} fields={fields} />; }
