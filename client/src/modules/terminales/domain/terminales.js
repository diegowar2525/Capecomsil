import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../terminales.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
