import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../tipos-gasto.fields.js';
export const prepare = values => prepararCampos(fields, values);
