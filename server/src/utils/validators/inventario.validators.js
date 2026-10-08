const { validateId, validateDate, validateOptionalText } = require("./common.validators");

const validateAjuste = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del ajuste son obligatorios");
        error.status = 400;
        throw error;
    }
    const id_producto = validateId(data.id_producto);
    const fecha = validateDate(data.fecha);
    if (!["string", "number"].includes(typeof data.cantidad)
        || !/^-?\d{1,10}(\.\d{1,2})?$/.test(String(data.cantidad))
        || /^-?0+(\.0+)?$/.test(String(data.cantidad))) {
        const error = new Error("La cantidad del ajuste debe ser distinta de cero, con signo opcional y máximo dos decimales");
        error.status = 400;
        throw error;
    }
    const motivo = validateOptionalText(data.motivo, "motivo", 150);
    if (!motivo) {
        const error = new Error("El motivo del ajuste es obligatorio");
        error.status = 400;
        throw error;
    }
    return {
        id_producto,
        fecha,
        cantidad: String(data.cantidad),
        motivo,
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

const validateFiltros = (query) => {
    const id_producto = query.id_producto === undefined ? null : validateId(query.id_producto);
    const fecha_desde = query.fecha_desde === undefined ? null : validateDate(query.fecha_desde);
    const fecha_hasta = query.fecha_hasta === undefined ? null : validateDate(query.fecha_hasta);
    const tipo_movimiento = query.tipo_movimiento ?? null;
    if ((fecha_desde && fecha_hasta && fecha_desde > fecha_hasta)
        || (tipo_movimiento !== null && !["ENTRADA", "SALIDA", "AJUSTE"].includes(tipo_movimiento))) {
        const error = new Error("El rango de fechas o el tipo de movimiento no es válido");
        error.status = 400;
        throw error;
    }
    const limit = query.limit === undefined ? 50 : Number(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if ((query.limit !== undefined && !/^\d+$/.test(String(query.limit)))
        || (query.offset !== undefined && !/^\d+$/.test(String(query.offset)))
        || !Number.isInteger(limit) || limit < 1 || limit > 200
        || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647) {
        const error = new Error("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo");
        error.status = 400;
        throw error;
    }
    return { id_producto, fecha_desde, fecha_hasta, tipo_movimiento, limit, offset };
};

module.exports = {
    validateAjuste,
    validateFiltros
};
