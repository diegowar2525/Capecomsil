const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del pago son obligatorios", 400);
    }
    const id_factura_proveedor = validateId(data.id_factura_proveedor);
    const fecha_pago = validateDate(data.fecha_pago);
    const monto = validateDecimal(data.monto, "monto", 12, 2);
    if (/^0+(\.0+)?$/.test(monto)) throw createHttpError("El monto debe ser mayor que cero", 400);
    const forma_pago = validateOptionalText(data.forma_pago, "forma_pago", 50)?.toUpperCase();
    if (!["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO"].includes(forma_pago)) {
        throw createHttpError("forma_pago debe ser EFECTIVO, TRANSFERENCIA, CHEQUE u OTRO", 400);
    }
    const numero_cheque = validateOptionalText(data.numero_cheque, "numero_cheque", 100);
    const numero_comprobante = validateOptionalText(data.numero_comprobante, "numero_comprobante", 100);
    if (forma_pago === "CHEQUE" && !numero_cheque) throw createHttpError("El número de cheque es obligatorio", 400);
    if (forma_pago === "TRANSFERENCIA" && !numero_comprobante) throw createHttpError("El número de comprobante es obligatorio", 400);
    if (forma_pago !== "CHEQUE" && numero_cheque) throw createHttpError("El número de cheque solo corresponde a pagos con cheque", 400);
    return { id_factura_proveedor, fecha_pago, monto, forma_pago, numero_cheque, numero_comprobante,
        observacion: validateOptionalText(data.observacion, "observacion") };
};

const validateFiltros = (query) => {
    const id_factura_proveedor = query.id_factura_proveedor === undefined ? null : validateId(query.id_factura_proveedor);
    const id_proveedor = query.id_proveedor === undefined ? null : validateId(query.id_proveedor);
    const fecha_desde = query.fecha_desde === undefined ? null : validateDate(query.fecha_desde);
    const fecha_hasta = query.fecha_hasta === undefined ? null : validateDate(query.fecha_hasta);
    const estado = query.estado ?? null;
    if (fecha_desde && fecha_hasta && fecha_desde > fecha_hasta) throw createHttpError("Rango de fechas inválido", 400);
    if (estado !== null && !["REGISTRADO", "ANULADO"].includes(estado)) throw createHttpError("Estado de pago inválido", 400);
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (limit > 200 || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))
        || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return { id_factura_proveedor, id_proveedor, fecha_desde, fecha_hasta, estado, limit, offset };
};

module.exports = { validateData, validateFiltros };
