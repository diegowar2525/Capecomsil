import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../recepciones-compra.fields.js';
export const prepare = values => prepararCampos(fields, values);
