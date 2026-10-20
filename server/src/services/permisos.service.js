const permisoModel = require("../models/permiso.model");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const findAll = async () => {
    return permisoModel.findAll();
};

const findById = async (id) => {
    const resultado = await permisoModel.findById(validateId(id));
    if (!resultado) {
        throw createHttpError("Permiso no encontrado", 404);
    }
    return resultado;
};

module.exports = {
    findAll,
    findById
};
