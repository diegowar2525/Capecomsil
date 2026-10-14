const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateObject = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Datos obligatorios", 400);
};

const validatePeriodo = (data) => {
    validateObject(data);
    const id_chofer = validateId(data.id_chofer);
    const fecha_desde = validateDate(data.fecha_desde);
    const fecha_hasta = validateDate(data.fecha_hasta);
    const dias = (Date.parse(fecha_hasta) - Date.parse(fecha_desde)) / 86400000;
    if (dias < 0 || dias > 365) throw createHttpError("El período debe tener entre 1 y 366 días", 400);
    return { id_chofer, fecha_desde, fecha_hasta };
};

const validateConfiguracion = (data) => {
    validateObject(data);
    const importe_diario = validateDecimal(data.importe_diario, "importe_diario", 10, 2);
    if (/^0+(\.0+)?$/.test(importe_diario)) throw createHttpError("El importe diario debe ser mayor que cero", 400);
    const adicional_dia_especial = validateDecimal(data.adicional_dia_especial, "adicional_dia_especial", 10, 2);
    const fecha_inicio = validateDate(data.fecha_inicio);
    const fecha_fin = data.fecha_fin == null ? null : validateDate(data.fecha_fin);
    if (fecha_fin && fecha_fin < fecha_inicio) throw createHttpError("Vigencia inválida", 400);
    return {
        importe_diario, adicional_dia_especial, fecha_inicio, fecha_fin,
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

const validateFeriado = (data) => {
    validateObject(data);
    const descripcion = validateOptionalText(data.descripcion, "descripcion", 150);
    if (!descripcion) throw createHttpError("La descripción del feriado es obligatoria", 400);
    return { fecha: validateDate(data.fecha), descripcion, observacion: validateOptionalText(data.observacion, "observacion") };
};

module.exports = {
    validatePeriodo,
    validateConfiguracion,
    validateFeriado
};
