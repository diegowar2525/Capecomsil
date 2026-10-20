const usuarioModel = require("../models/usuario.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateFiltros } = require("../utils/validators/usuario.validators");
const { createHttpError } = require("../utils/errors/http.error");

const findAll = async (query) => {
    const datosValidados = validateFiltros(query);
    return usuarioModel.findAll(datosValidados);
};

const findById = async (id) => {
    const resultado = await usuarioModel.findById(validateId(id));
    if (!resultado) {
        throw createHttpError("Usuario no encontrado", 404);
    }
    return resultado;
};

module.exports = {
    findAll,
    findById
};
