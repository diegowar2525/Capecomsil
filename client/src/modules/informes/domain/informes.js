import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../informes.fields.js';
export const prepare = values => prepararCampos(fields, values);
