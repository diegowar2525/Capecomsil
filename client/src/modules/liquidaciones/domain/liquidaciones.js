import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../liquidaciones.fields.js';
export function prepare(values, catalogos, registro, action) {
 const data = prepararCampos(action.fields ?? fields, values);
 delete data.seleccion_entregas;
 return registro ? { ...data, version: registro.version } : data;
}
export function prepareAction(action, values, registro) {
 const data = prepararCampos(action.fields ?? [], values);
 return registro ? { ...data, version: registro.version } : data;
}
