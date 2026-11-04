const { createHttpError } = require("../utils/errors/http.error");
const provinciaModel = require("../models/provincia.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/provincia.validators");

const getProvincias = async () => {
    return await provinciaModel.findAll();
};

const getProvinciaById = async (id) => {
    const idNumerico = validateId(id);
    const provincia = await provinciaModel.findById(idNumerico);
    if (!provincia) {
        throw createHttpError("Provincia no encontrada", 404);
    }
    return provincia;
};

const createProvincia = async (data) => {
    const datosValidados = validateData(data);
    return await provinciaModel.create(datosValidados);
};

const updateProvincia = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const provincia = await provinciaModel.update(idNumerico, datosValidados);
    if (!provincia) {
        throw createHttpError("Provincia no encontrada", 404);
    }
    return provincia;
};

const deleteProvincia = async (id) => {
    const idNumerico = validateId(id);
    const provincia = await provinciaModel.remove(idNumerico);
    if (!provincia) {
        throw createHttpError("Provincia no encontrada", 404);
    }
    return provincia;
};

module.exports = {
    getProvincias,
    getProvinciaById,
    createProvincia,
    updateProvincia,
    deleteProvincia
};
