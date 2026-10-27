import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../remuneraciones-chofer.fields.js';
export const prepare = values => prepararCampos(fields, values);
