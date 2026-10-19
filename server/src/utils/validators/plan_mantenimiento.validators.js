const {
    validateId,
    validateDecimal,
    validateDateTime,
    validateOptionalText
} = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Datos del plan obligatorios", 400);
    }
    const nombre = validateOptionalText(data.nombre, "nombre", 150);
    if (!nombre) {
        throw createHttpError("El nombre del plan es obligatorio", 400);
    }
    const intervalo_km = validateDecimal(data.intervalo_km, "intervalo_km", 10, 2);
    if (/^0+(\.0+)?$/.test(intervalo_km)) {
        throw createHttpError("El intervalo debe ser mayor que cero", 400);
    }
    if (data.estado !== undefined && typeof data.estado !== "boolean") {
        throw createHttpError("estado debe ser true o false", 400);
    }
    return {
        id_vehiculo: validateId(data.id_vehiculo),
        nombre,
        intervalo_km,
        kilometraje_referencia_inicial: validateDecimal(
            data.kilometraje_referencia_inicial,
            "kilometraje_referencia_inicial",
            10,
            2
        ),
        anticipacion_aviso_km: validateDecimal(
            data.anticipacion_aviso_km ?? 0,
            "anticipacion_aviso_km",
            10,
            2
        ),
        estado: data.estado ?? true,
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

const validateFiltros = (query = {}) => {
    const estado = query.estado === undefined ? null : query.estado;
    if (estado !== null && !["true", "false"].includes(estado)) {
        throw createHttpError("Filtro estado inválido", 400);
    }
    const situacion = query.situacion ?? null;
    if (
        situacion !== null &&
        !["AL_DIA", "PROXIMO", "VENCIDO", "INACTIVO", "SIN_CONFIGURAR"].includes(situacion)
    ) {
        throw createHttpError("Situación del plan inválida", 400);
    }
    return {
        id_vehiculo: query.id_vehiculo === undefined ? null : validateId(query.id_vehiculo),
        estado: estado === null ? null : estado === "true",
        situacion,
        fecha_hasta: query.fecha_hasta === undefined ? null : validateDateTime(query.fecha_hasta)
    };
};

const validatePlanesCumplidos = (value = []) => {
    if (!Array.isArray(value)) {
        throw createHttpError("planes_cumplidos debe ser una lista de IDs", 400);
    }
    const ids = value.map(validateId);
    if (new Set(ids).size !== ids.length) {
        throw createHttpError("No repita planes en el mismo mantenimiento", 400);
    }
    return ids.sort((a, b) => a - b);
};

module.exports = {
    validateData,
    validateFiltros,
    validatePlanesCumplidos
};
