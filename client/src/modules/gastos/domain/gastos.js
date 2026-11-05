import { prepararCampos, campoVisible } from '../../../domain/catalogo.js';
import { fields } from '../gastos.fields.js';
export function prepare(values, catalogos, registro, action) {
    const data = prepararCampos(action?.fields ?? fields, values);
    return data;
}

// El detalle ya muestra los nombres de tipo, vehículo y proveedor mediante columns.
// La pregunta "origen" sirve para elegir el formulario, no para repetir el tipo registrado.
export function detailFields(registro) {
    const soloFormulario = new Set(['origen', 'id_tipo_gasto', 'id_vehiculo', 'id_proveedor']);
    return fields.filter(field => !soloFormulario.has(field.name) && campoVisible(field, registro));
}
