import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../productos-inventario.fields.js';

const esLlanta = (values, catalogos) => catalogos.id_categoria?.find((item) => item.value === String(values.id_categoria))?.es_llanta === true;

export function formFields(values, catalogos) {
    return fields.filter((field) => field.name !== 'condicion_llanta' || esLlanta(values, catalogos))
        .map((field) => {
            if (field.name === 'condicion_llanta') return { ...field, required: true };
            if (field.name === 'unidad_medida' && values.unidad_medida && !field.options.some(option => option.value === values.unidad_medida)) {
                return { ...field, options: [...field.options, { value: values.unidad_medida, label: values.unidad_medida }] };
            }
            return field;
        });
}

export function prepare(values, catalogos) {
    const data = prepararCampos(fields, values);
    if (esLlanta(values, catalogos) && !data.condicion_llanta) throw new Error('Indica la condición de la llanta.');
    if (!esLlanta(values, catalogos)) data.condicion_llanta = null;
    return data;
}
