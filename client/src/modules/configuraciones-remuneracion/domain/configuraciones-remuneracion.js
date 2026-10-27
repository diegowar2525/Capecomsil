import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../configuraciones-remuneracion.fields.js';
export const prepare = (values) => prepararCampos(fields, values);
