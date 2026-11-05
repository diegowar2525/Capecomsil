import { RemuneracionesResumen } from './components/RemuneracionesResumen.jsx';
import { filters } from './remuneraciones-chofer.filters.js';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import { fields } from './remuneraciones-chofer.fields.js';
import { columns } from './remuneraciones-chofer.columns.js';
import { page } from './remuneraciones-chofer.config.js';
import { actions as declaredActions } from './remuneraciones-chofer.actions.js';
import { api } from './services/remuneraciones-chofer.api.js';
import { prepare } from './domain/remuneraciones-chofer.js';
const actions = declaredActions.map(action => ({ ...action, query: Boolean(action.readOnly && action.global), permission: action.id === 'reverse' ? 'inventario.revertir' : action.id === 'annul' ? 'remuneraciones.anular' : 'remuneraciones.consultar' }));
const definition = { Summary: RemuneracionesResumen, detailFields: [{name:'importe_base',label:'Importe base'}, {name:'importe_adicional',label:'Adicional'}, {name:'trabajo_realizado',label:'Realizó viajes'}, {name:'es_domingo',label:'Domingo'}, {name:'tipo_remuneracion_aplicado',label:'Modalidad aplicada'}], filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'remuneraciones', };
export function RemuneracionesPage() { return <ConsultaCatalogo definition={definition} fields={fields} />; }
