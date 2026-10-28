import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { crudActions } from '../../components/CatalogoConectado/catalogo.actions.js';
import { fields } from './tipos-gasto.fields.js';
import { columns } from './tipos-gasto.columns.js';
import { filters } from './tipos-gasto.filters.js';
import { api } from './services/tipos-gasto.api.js';
import { prepare } from './domain/tipos-gasto.js';
import { useTiposGasto } from './hooks/useTiposGasto.js';
const definition = {page:{title:'Tipos de gasto',subtitle:'Catálogo para clasificar los gastos operativos',actionLabel:'Nuevo tipo de gasto'},
 formFields: (_values, _catalogos, registro) => fields.map(field => ({...field, disabled: Boolean(registro && (field.name === 'codigo' || (registro.reservado && field.name === 'estado')))})),
 fields,columns,filters,api,prepare,rowKey:'id_tipo_gasto',
 actions:crudActions.map(action=>action.id==='delete'?{...action,available:row=>!row.reservado}:action),
 formMessage:'El código es permanente. Viático y combustible son tipos reservados; sus nombres y descripciones sí pueden editarse.'};
export function TiposGastoPage(){return <CatalogoConectado definition={definition} controller={useTiposGasto()}/>;}
