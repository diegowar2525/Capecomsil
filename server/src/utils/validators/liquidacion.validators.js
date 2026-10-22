const { validateId, validateDate, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateCampos = (data, permitidos) => {
    if (!data || typeof data !== "object" || Array.isArray(data)
        || Object.keys(data).some((campo) => !permitidos.includes(campo))) {
        throw createHttpError("Campos de liquidación no admitidos", 400);
    }
};

const validatePeriodo = (data) => {
    const periodo_inicio = validateDate(data.periodo_inicio);
    const periodo_fin = validateDate(data.periodo_fin);
    if (periodo_fin < periodo_inicio) {
        throw createHttpError("El fin del período no puede ser anterior al inicio", 400);
    }
    return { id_gasolinera: validateId(data.id_gasolinera), periodo_inicio, periodo_fin };
};

const validateEntregas = (value, permitirVacio) => {
    if (!Array.isArray(value) || (!permitirVacio && value.length === 0)) {
        throw createHttpError("id_detalles_viaje debe ser una lista de entregas", 400);
    }
    const ids = value.map((id) => validateId(id));
    if (new Set(ids).size !== ids.length) {
        throw createHttpError("No repita entregas en la liquidación", 400);
    }
    return ids.sort((a, b) => a - b);
};

const validateCreacion = (data) => {
    validateCampos(data, ["id_gasolinera", "periodo_inicio", "periodo_fin", "observacion", "id_detalles_viaje"]);
    return {
        ...validatePeriodo(data),
        observacion: validateOptionalText(data.observacion, "observacion"),
        id_detalles_viaje: data.id_detalles_viaje === undefined ? null : validateEntregas(data.id_detalles_viaje, false)
    };
};

const validateEdicion = (data) => {
    validateCampos(data, ["id_gasolinera", "periodo_inicio", "periodo_fin", "observacion", "id_detalles_viaje", "version"]);
    return {
        ...validatePeriodo(data),
        observacion: validateOptionalText(data.observacion, "observacion"),
        id_detalles_viaje: validateEntregas(data.id_detalles_viaje, true),
        version: validateId(data.version)
    };
};

const validateDisponibles = (query) => {
    validateCampos(query, ["id_gasolinera", "periodo_inicio", "periodo_fin", "id_liquidacion"]);
    return {
        ...validatePeriodo(query),
        id_liquidacion: query.id_liquidacion === undefined ? null : validateId(query.id_liquidacion)
    };
};

const validateFiltros = (query = {}) => {
    validateCampos(query, ["id_gasolinera", "estado", "periodo_desde", "periodo_hasta", "limit", "offset"]);
    const estado = query.estado ?? null;
    if (estado !== null && !["BORRADOR", "ENVIADA", "CONFIRMADA", "ANULADA"].includes(estado)) {
        throw createHttpError("Estado de liquidación inválido", 400);
    }
    const periodo_desde = query.periodo_desde === undefined ? null : validateDate(query.periodo_desde);
    const periodo_hasta = query.periodo_hasta === undefined ? null : validateDate(query.periodo_hasta);
    if (periodo_desde && periodo_hasta && periodo_desde > periodo_hasta) {
        throw createHttpError("Rango de períodos inválido", 400);
    }
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647
        || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return { id_gasolinera: query.id_gasolinera === undefined ? null : validateId(query.id_gasolinera),
        estado, periodo_desde, periodo_hasta, limit, offset };
};

module.exports = { validateCreacion, validateEdicion, validateDisponibles, validateFiltros };
