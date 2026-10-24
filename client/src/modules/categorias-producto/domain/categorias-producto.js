import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../categorias-producto.fields.js';

export const prepare = (values) => prepararCampos(fields, values);
