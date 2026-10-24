import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../productos.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
