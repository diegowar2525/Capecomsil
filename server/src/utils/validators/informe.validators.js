const { validateId, validateDate } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateFiltros = (query = {}, admiteChofer = false) => {
    const fecha_desde = validateDate(query.fecha_desde);
    const fecha_hasta = validateDate(query.fecha_hasta);
    const dias = (Date.parse(fecha_hasta) - Date.parse(fecha_desde)) / 86400000;
    if (dias < 0 || dias > 365) throw createHttpError("El período debe contener entre 1 y 366 días", 400);
    const permitidos = ["fecha_desde", "fecha_hasta", "limit", "offset", admiteChofer ? "id_chofer" : "id_vehiculo"];
    if (Object.keys(query).some(key => !permitidos.includes(key))) throw createHttpError("Filtro no admitido para este informe", 400);
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647
        || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return {
        fecha_desde, fecha_hasta, limit, offset,
        id_vehiculo: query.id_vehiculo === undefined ? null : validateId(query.id_vehiculo),
        id_chofer: query.id_chofer === undefined ? null : validateId(query.id_chofer)
    };
};

module.exports = { validateFiltros };
