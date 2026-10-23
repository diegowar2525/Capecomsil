const { validateId, validateDate } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateCampos = (data, fields) => {
    if (!data || typeof data !== "object" || Array.isArray(data)
        || Object.keys(data).some((key) => !fields.includes(key))) {
        throw createHttpError("Campos de modalidad no admitidos", 400);
    }
};

const validateData = (data) => {
    validateCampos(data, ["id_gasolinera", "modalidad", "fecha_inicio"]);
    if (!["POR_TERMINAL", "POR_CAPACIDAD"].includes(data.modalidad)) {
        throw createHttpError("Modalidad inválida", 400);
    }
    return {
        id_gasolinera: validateId(data.id_gasolinera),
        modalidad: data.modalidad,
        fecha_inicio: validateDate(data.fecha_inicio)
    };
};

const validateFiltros = (query = {}) => {
    validateCampos(query, ["id_gasolinera"]);
    return query.id_gasolinera === undefined ? null : validateId(query.id_gasolinera);
};

module.exports = { validateData, validateFiltros };
