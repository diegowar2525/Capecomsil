const {
    validateId,
    validateDate,
    validateDecimal,
    validateOptionalText
} = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateConfiguracion = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Datos obligatorios", 400);
    }
    const fecha_inicio = validateDate(data.fecha_inicio);
    const fecha_fin = data.fecha_fin == null ? null : validateDate(data.fecha_fin);
    if (fecha_fin && fecha_fin < fecha_inicio) {
        throw createHttpError("Vigencia inválida", 400);
    }
    const importe_diario = validateDecimal(data.importe_diario, "importe_diario", 10, 2);
    if (/^0+(\.0+)?$/.test(importe_diario)) {
        throw createHttpError("importe_diario debe ser mayor que cero", 400);
    }
    return {
        importe_diario,
        fecha_inicio,
        fecha_fin,
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

module.exports = {
    validateConfiguracion
};
