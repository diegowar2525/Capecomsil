const { validateId, validateDate, validateDecimal, validateOptionalText } = require('./common.validators');
const { createHttpError } = require('../errors/http.error');
const validateData = (data, tipo) => {
    if (!data || data.total == null || !['CLIENTE', 'PROVEEDOR'].includes(tipo)) throw createHttpError('Documento histórico inválido', 400);
    const texto = (key, max = 250) => {
        const value = validateOptionalText(data[key], key, max);
        if (!value) throw createHttpError(`Indique ${key}`, 400);
        return value;
    };
    const importe = key => validateDecimal(data[key] ?? '0', key, 14, 2);
    const result = {
        id_titular: validateId(tipo === 'CLIENTE' ? data.id_empresa : data.id_proveedor),
        numero_factura: texto('numero_factura', 50),
        fecha_emision: validateDate(data.fecha_emision),
        fecha_vencimiento: data.fecha_vencimiento ? validateDate(data.fecha_vencimiento) : null,
        fecha_corte: validateDate(data.fecha_corte),
        archivo_origen: texto('archivo_origen'), hoja_origen: texto('hoja_origen'),
        fila_origen: validateId(data.fila_origen), huella_origen: texto('huella_origen', 64),
        total: importe('total'), importe_pagado_previo: importe('importe_pagado_previo'),
        retencion: tipo === 'CLIENTE' ? importe('retencion') : '0',
        estado: data.estado ?? 'REGISTRADA',
        motivo_anulacion: validateOptionalText(data.motivo_anulacion, 'motivo_anulacion', 150)
    };
    if (!/^[a-f0-9]{64}$/.test(result.huella_origen) || (Number(result.importe_pagado_previo)>0 && result.fecha_emision >= result.fecha_corte) ||
        (result.fecha_vencimiento && result.fecha_vencimiento < result.fecha_emision) ||
        !['REGISTRADA','ANULADA'].includes(result.estado) || Number(result.total)<0 ||
        Number(result.retencion)<0 || Number(result.importe_pagado_previo)<0 ||
        Number(result.importe_pagado_previo)>Number(result.total) ||
        (result.estado==='ANULADA' && (!result.motivo_anulacion || Number(result.importe_pagado_previo)>0))) {
        throw createHttpError('Revise fechas, origen, estado e importes históricos', 400);
    }
    return result;
};
module.exports = { validateData };
