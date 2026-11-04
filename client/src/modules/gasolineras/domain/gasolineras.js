import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../gasolineras.fields.js';

export const prepare = (values) => prepararCampos(fields.filter(field => field.name !== 'id_provincia'), values);
