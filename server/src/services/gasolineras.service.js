const { createHttpError } = require("../utils/errors/http.error");
const gasolineraModel = require("../models/gasolinera.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/gasolinera.validators");

const getGasolineras = async () => {
    return await gasolineraModel.findAll();
};

const getGasolineraById = async (id) => {
    const idNumerico = validateId(id);
    const gasolinera = await gasolineraModel.findById(idNumerico);
    if (!gasolinera) {
        throw createHttpError("Gasolinera no encontrada", 404);
    }
    return gasolinera;
};

const createGasolinera = async (data) => {
    const datosValidados = validateData(data);
    return await gasolineraModel.create(datosValidados);
};

const updateGasolinera = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const existingGasolinera = await gasolineraModel.findById(idNumerico);
    if (!existingGasolinera) {
        throw createHttpError("Gasolinera no encontrada", 404);
    }
    return await gasolineraModel.update(idNumerico, datosValidados);
};

const deleteGasolinera = async (id) => {
    const idNumerico = validateId(id);
    const gasolinera = await gasolineraModel.findById(idNumerico);
    if (!gasolinera) {
        throw createHttpError("Gasolinera no encontrada", 404);
    }
    return await gasolineraModel.remove(idNumerico);
};

module.exports = {
    getGasolineras,
    getGasolineraById,
    createGasolinera,
    updateGasolinera,
    deleteGasolinera
};
