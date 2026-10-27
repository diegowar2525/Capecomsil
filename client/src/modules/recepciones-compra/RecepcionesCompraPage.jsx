import { filters } from './recepciones-compra.filters.js';
import { RecepcionForm } from './components/RecepcionForm.jsx';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import { fields } from './recepciones-compra.fields.js';
import { columns } from './recepciones-compra.columns.js';
import { page } from './recepciones-compra.config.js';
import { actions as declaredActions } from './recepciones-compra.actions.js';
import { api } from './services/recepciones-compra.api.js';
import { prepare } from './domain/recepciones-compra.js';
const actions = declaredActions.map(action => ({ ...action, query: Boolean(action.readOnly && action.global), permission: action.id === 'reverse' ? 'inventario.revertir' : action.id === 'annul' ? 'recepciones.anular' : 'recepciones.consultar' }));
const definition = { filters, renderForm: props => <RecepcionForm {...props} />, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'recepciones',  };
export function RecepcionesCompraPage() { return <ConsultaCatalogo definition={definition} fields={fields.slice(0, 1)} />; }
