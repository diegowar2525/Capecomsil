const { createHttpError } = require("../utils/errors/http.error");
const empresaModel = require("../models/empresa.model");
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
    const empresa = await empresaModel.findById(datosValidados.id_empresa);
    if (!empresa) throw createHttpError("Empresa no encontrada", 400);
    datosValidados.ruc = empresa.ruc;
    const creada = await gasolineraModel.create(datosValidados);
    return await gasolineraModel.findById(creada.id_gasolinera);
};

const updateGasolinera = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const empresa = await empresaModel.findById(datosValidados.id_empresa);
    if (!empresa) throw createHttpError("Empresa no encontrada", 400);
    datosValidados.ruc = empresa.ruc;
    const existingGasolinera = await gasolineraModel.findById(idNumerico);
    if (!existingGasolinera) {
        throw createHttpError("Gasolinera no encontrada", 404);
    }
    await gasolineraModel.update(idNumerico, datosValidados);
    return await gasolineraModel.findById(idNumerico);
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
