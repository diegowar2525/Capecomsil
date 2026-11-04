import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../ciudades.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
