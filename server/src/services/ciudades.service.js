const { createHttpError } = require("../utils/errors/http.error");
const ciudadModel = require("../models/ciudad.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/ciudad.validators");

const getCiudades = async () => {
    return await ciudadModel.findAll();
};

const getCiudadById = async (id) => {
    const idNumerico = validateId(id);
    const ciudad = await ciudadModel.findById(idNumerico);
    if (!ciudad) {
        throw createHttpError("Ciudad no encontrada", 404);
    }
    return ciudad;
};

const createCiudad = async (data) => {
    const datosValidados = validateData(data);
    return await ciudadModel.create(datosValidados);
};

const updateCiudad = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const ciudad = await ciudadModel.update(idNumerico, datosValidados);
    if (!ciudad) {
        throw createHttpError("Ciudad no encontrada", 404);
    }
    return ciudad;
};

const deleteCiudad = async (id) => {
    const idNumerico = validateId(id);
    const ciudad = await ciudadModel.remove(idNumerico);
    if (!ciudad) {
        throw createHttpError("Ciudad no encontrada", 404);
    }
    return ciudad;
};

module.exports = {
    getCiudades,
    getCiudadById,
    createCiudad,
    updateCiudad,
    deleteCiudad
};
