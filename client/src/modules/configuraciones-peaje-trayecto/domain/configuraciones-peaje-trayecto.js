import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../configuraciones-peaje-trayecto.fields.js';
export function prepare(values, catalogos, registro, action) {
    const data = prepararCampos(action?.fields ?? fields, values);
    return data;
}
