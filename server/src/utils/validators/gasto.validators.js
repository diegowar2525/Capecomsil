const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const optionalId = value => value == null ? null : validateId(value);

const validateData = data => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Los datos del gasto son obligatorios", 400);
    const tipo_gasto = validateOptionalText(data.tipo_gasto, "tipo_gasto", 100)?.toUpperCase();
    if (!tipo_gasto) throw createHttpError("tipo_gasto es obligatorio", 400);
    const monto = validateDecimal(data.monto, "monto", 12, 2);
    if (/^0+(\.0+)?$/.test(monto)) throw createHttpError("El monto debe ser mayor que cero", 400);
    const id_viaje = optionalId(data.id_viaje);
    const id_viatico_chofer = optionalId(data.id_viatico_chofer);
    if (id_viatico_chofer && (tipo_gasto !== "VIATICO" || id_viaje)) {
        throw createHttpError("Un viático diario debe vincularse a id_viatico_chofer sin id_viaje", 400);
    }
    return {
        id_viaje, id_viatico_chofer, id_vehiculo: optionalId(data.id_vehiculo),
        id_proveedor: optionalId(data.id_proveedor), fecha: validateDate(data.fecha), tipo_gasto, monto,
        descripcion: validateOptionalText(data.descripcion, "descripcion"),
        numero_comprobante: validateOptionalText(data.numero_comprobante, "numero_comprobante", 100),
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

const validateFiltros = (query = {}) => {
    const fecha_desde = query.fecha_desde === undefined ? null : validateDate(query.fecha_desde);
    const fecha_hasta = query.fecha_hasta === undefined ? null : validateDate(query.fecha_hasta);
    if (fecha_desde && fecha_hasta && fecha_desde > fecha_hasta) throw createHttpError("Rango de fechas inválido", 400);
    const estado = query.estado ?? null;
    if (estado !== null && !["REGISTRADO", "ANULADO"].includes(estado)) throw createHttpError("Estado inválido", 400);
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647
        || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return {
        fecha_desde, fecha_hasta, estado, limit, offset,
        id_vehiculo: optionalId(query.id_vehiculo), id_viaje: optionalId(query.id_viaje),
        id_proveedor: optionalId(query.id_proveedor), id_viatico_chofer: optionalId(query.id_viatico_chofer),
        tipo_gasto: validateOptionalText(query.tipo_gasto, "tipo_gasto", 100)?.toUpperCase() ?? null
    };
};

module.exports = { 
    validateData, 
    validateFiltros 
};
