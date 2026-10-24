import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../proveedores.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
