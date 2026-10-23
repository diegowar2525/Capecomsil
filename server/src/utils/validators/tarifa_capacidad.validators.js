const { validateId, validateDate, validateDecimal } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    const fields = ["id_gasolinera", "capacidad_galones", "valor_por_galon", "fecha_inicio", "fecha_fin", "estado"];
    if (!data || typeof data !== "object" || Array.isArray(data)
        || Object.keys(data).some((key) => !fields.includes(key))) {
        throw createHttpError("Campos de tarifa no admitidos", 400);
    }
    const capacidad = validateId(data.capacidad_galones);
    if (![4000, 6000, 8000, 10000].includes(capacidad)) {
        throw createHttpError("Capacidad admitida: 4000, 6000, 8000 o 10000 galones", 400);
    }
    const fecha_inicio = validateDate(data.fecha_inicio);
    const fecha_fin = data.fecha_fin == null ? null : validateDate(data.fecha_fin);
    if (fecha_fin && fecha_fin < fecha_inicio) {
        throw createHttpError("Vigencia inválida", 400);
    }
    if (data.estado !== undefined && typeof data.estado !== "boolean") {
        throw createHttpError("estado debe ser booleano", 400);
    }
    return {
        id_gasolinera: validateId(data.id_gasolinera),
        capacidad_galones: capacidad,
        valor_por_galon: validateDecimal(data.valor_por_galon, "valor_por_galon", 8, 4),
        fecha_inicio,
        fecha_fin,
        estado: data.estado ?? true
    };
};

module.exports = { validateData };
