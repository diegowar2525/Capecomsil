import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../facturas-proveedores.fields.js';
export function prepare(values) {
    const data = prepararCampos(fields, values);
    delete data.incluir_recepcion_inicial;
    return data;
}
