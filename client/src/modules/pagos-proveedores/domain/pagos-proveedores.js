import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../pagos-proveedores.fields.js';
export function prepare(values, catalogos, registro, action) {
    const data = prepararCampos(action?.fields ?? fields, values);
    return data;
}
