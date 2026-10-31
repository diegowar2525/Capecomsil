import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../pagos.fields.js';
export const prepare = (values, catalogos, registro, action) => prepararCampos(action?.fields ?? fields, values);
