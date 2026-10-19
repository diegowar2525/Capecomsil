const { createHttpError } = require("../utils/errors/http.error");
const choferModel = require("../models/chofer.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/chofer.validators");

const getChoferes = async () => {
    return await choferModel.findAll();
};

const getChoferById = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.findById(idNumerico);
    if (!chofer) {
        throw createHttpError("Chofer no encontrado.", 404);
    }
    return chofer;
};

const createChofer = async (data) => {
    const datosValidados = validateData(data);
    return await choferModel.create(datosValidados);
};

const updateChofer = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const chofer = await choferModel.update(idNumerico, datosValidados);
    if (!chofer) {
        throw createHttpError("Chofer no encontrado.", 404);
    }
    return chofer;
};

const deleteChofer = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.remove(idNumerico);
    if (!chofer) {
        throw createHttpError("Chofer no encontrado.", 404);
    }
    return chofer;
};

module.exports = {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer
};
