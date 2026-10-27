import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../configuraciones-viatico.fields.js';
export const prepare = (values) => prepararCampos(fields, values);
