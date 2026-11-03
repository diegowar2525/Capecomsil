import { prepararCampos } from '../../../domain/catalogo.js';
import { fields } from '../mantenimiento.fields.js';
import { servicioInicial } from './formulario.js';
export function prepare(values, catalogos, registro, action) {
    const data = prepararCampos(action?.fields ?? fields, values);
    if (registro && action?.id === 'edit') {
        data.version = registro.version;
        if (registro.id_factura_proveedor) data.monto = registro.monto;
    }
    if (values.clase !== 'PREVENTIVO' || !values.fecha_fin) data.planes_cumplidos = [];
    return data;
}

export const initial = registro => ({
    ...registro,
    modalidad_pago: registro.id_factura_proveedor ? 'EXISTENTE' : 'DIRECTO',
    factura: {detalles:[servicioInicial(registro.tipo)]},
    numero_comprobante: registro.pagos?.find(pago => pago.estado === 'REGISTRADO' && !pago.id_pago_proveedor)?.numero_comprobante ?? ''
});
