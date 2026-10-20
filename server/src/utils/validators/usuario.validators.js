const { validateId } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateFiltros = (query = {}) => {
    if (!query || typeof query !== "object" || Array.isArray(query)) {
        throw createHttpError("Los filtros de usuarios deben ser un objeto", 400);
    }
    const permitidos = ["activo", "id_rol", "limit", "offset"];
    if (Object.keys(query).some((campo) => !permitidos.includes(campo))) {
        throw createHttpError("Filtro de usuarios no admitido", 400);
    }
    if (query.activo !== undefined && !["true", "false"].includes(query.activo)) {
        throw createHttpError("activo debe ser true o false", 400);
    }
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (
        limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647 ||
        (query.offset !== undefined &&
            (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))
    ) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return {
        activo: query.activo === undefined ? null : query.activo === "true",
        id_rol: query.id_rol === undefined ? null : validateId(query.id_rol),
        limit,
        offset
    };
};

module.exports = {
    validateFiltros
};
