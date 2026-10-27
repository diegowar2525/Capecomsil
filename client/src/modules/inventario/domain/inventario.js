import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../inventario.fields.js';
export const prepare = values => prepararCampos(fields, values);
