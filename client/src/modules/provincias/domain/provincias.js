import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../provincias.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
