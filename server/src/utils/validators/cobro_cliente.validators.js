const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");
const { validateCampos, validateAnulacion, validateFiltros: filtros } = require("./factura_cliente.validators");
const validateData = (data) => {
    validateCampos(data, ["id_factura", "fecha_pago", "monto", "forma_pago", "banco", "numero_comprobante", "observacion"]);
    const monto = validateDecimal(data.monto, "monto", 12, 2);
    if (Number(monto) <= 0) {
        throw createHttpError("El monto debe ser mayor que cero", 400);
    }
    const forma_pago = validateOptionalText(data.forma_pago, "forma_pago", 50)?.toUpperCase();
    if (!["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO"].includes(forma_pago)) {
        throw createHttpError("Forma de pago inválida", 400);
    }
    const numero_comprobante = validateOptionalText(data.numero_comprobante, "numero_comprobante", 100);
    if (["TRANSFERENCIA", "CHEQUE"].includes(forma_pago) && !numero_comprobante) {
        throw createHttpError("Indique el comprobante o número de cheque", 400);
    }
    return { id_factura: validateId(data.id_factura), fecha_pago: validateDate(data.fecha_pago), monto, forma_pago,
        banco: validateOptionalText(data.banco, "banco", 100), numero_comprobante,
        observacion: validateOptionalText(data.observacion, "observacion") };
};
const validateFiltros = (query) => {
    return filtros(query, true);
};

module.exports = { validateData, validateAnulacion, validateFiltros };
