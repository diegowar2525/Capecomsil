const { validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)
        || Object.keys(data).some(key => !["fecha", "monto", "numero_comprobante", "observacion"].includes(key))) {
        throw createHttpError("Datos del pago no admitidos", 400);
    }
    const monto = validateDecimal(data.monto, "monto", 12, 2);
    if (Number(monto) <= 0) {
        throw createHttpError("El monto debe ser positivo", 400);
    }
    return { fecha: validateDate(data.fecha), monto,
        numero_comprobante: validateOptionalText(data.numero_comprobante, "numero_comprobante", 100),
        observacion: validateOptionalText(data.observacion, "observacion") };
};
module.exports = { validateData };
