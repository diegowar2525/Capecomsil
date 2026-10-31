const { validateId, validateDate, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateCampos = (data, campos) => {
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(key => !campos.includes(key))) {
        throw createHttpError("Campos no admitidos", 400);
    }
};
const validateData = (data) => {
    validateCampos(data, ["id_liquidacion", "numero_factura", "fecha_emision", "fecha_vencimiento", "observacion"]);
    const numero_factura = validateOptionalText(data.numero_factura, "numero_factura", 50);
    if (!numero_factura) {
        throw createHttpError("El número de factura es obligatorio", 400);
    }
    const fecha_emision = validateDate(data.fecha_emision);
    const fecha_vencimiento = data.fecha_vencimiento == null || data.fecha_vencimiento === "" ? null : validateDate(data.fecha_vencimiento);
    if (fecha_vencimiento && fecha_vencimiento < fecha_emision) {
        throw createHttpError("El vencimiento no puede preceder a la emisión", 400);
    }
    return { id_liquidacion: validateId(data.id_liquidacion), numero_factura, fecha_emision, fecha_vencimiento,
        observacion: validateOptionalText(data.observacion, "observacion") };
};
const validateAnulacion = (data) => {
    validateCampos(data, ["motivo"]);
    const motivo = validateOptionalText(data.motivo, "motivo", 150);
    if (!motivo) {
        throw createHttpError("Indique el motivo de anulación", 400);
    }
    return { motivo };
};
const validateFiltros = (query = {}, cobros = false) => {
    const campos = ["id_gasolinera", "fecha_desde", "fecha_hasta", "estado", "limit", "offset", ...(cobros ? ["id_factura"] : ["id_liquidacion", "estado_cobro"])];
    validateCampos(query, campos);
    const result = {};
    for (const key of campos.filter(key => key.startsWith("id_"))) {
        result[key] = query[key] === undefined ? null : validateId(query[key]);
    }
    for (const key of ["fecha_desde", "fecha_hasta"]) {
        result[key] = query[key] === undefined ? null : validateDate(query[key]);
    }
    if (result.fecha_desde && result.fecha_hasta && result.fecha_desde > result.fecha_hasta) {
        throw createHttpError("Rango de fechas inválido", 400);
    }
    result.estado = query.estado ?? null;
    if (result.estado !== null && !(cobros ? ["REGISTRADO", "ANULADO"] : ["REGISTRADA", "ANULADA"]).includes(result.estado)) {
        throw createHttpError("Estado inválido", 400);
    }
    result.estado_cobro = query.estado_cobro ?? null;
    if (result.estado_cobro !== null && !["PENDIENTE", "PARCIAL", "COBRADA", "ANULADA"].includes(result.estado_cobro)) {
        throw createHttpError("Estado de cobro inválido", 400);
    }
    result.limit = query.limit === undefined ? 50 : validateId(query.limit);
    result.offset = query.offset === undefined ? 0 : Number(query.offset);
    if (result.limit > 200 || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset))) || !Number.isSafeInteger(result.offset) || result.offset < 0 || result.offset > 2147483647) {
        throw createHttpError("Paginación inválida", 400);
    }
    return result;
};
module.exports = { validateCampos, validateData, validateAnulacion, validateFiltros };
