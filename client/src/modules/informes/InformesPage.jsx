import { filters } from './informes.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './informes.fields.js';
import { columns } from './informes.columns.js';
import { page } from './informes.config.js';
import { actions as declaredActions } from './informes.actions.js';
import { api } from './services/informes.api.js';
import { prepare } from './domain/informes.js';
import { useInformes } from './hooks/useInformes.js';
const actions = declaredActions.map(action => ({ ...action, query: Boolean(action.readOnly && action.global), permission: action.id === 'reverse' ? 'inventario.revertir' : action.id === 'annul' ? 'informes.anular' : 'informes.consultar' }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'informes',  };
export function InformesPage() { return <CatalogoConectado definition={definition} controller={useInformes()} />; }
