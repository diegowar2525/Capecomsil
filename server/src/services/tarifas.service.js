const { createHttpError } = require("../utils/errors/http.error");
const tarifaModel = require("../models/tarifa.model");
const { validateId, validateData } = require("../utils/validators/tarifa.validators");

const getTarifas = async () => {
    return await tarifaModel.findAll();
};

const getTarifaById = async (id) => {
    const idNumerico = validateId(id);
    const tarifa = await tarifaModel.findById(idNumerico);
    if (!tarifa) {
        throw createHttpError("Tarifa no encontrada", 404);
    }
    return tarifa;
};

const createTarifa = async (data) => {
    const datosValidados = validateData(data);
    return await tarifaModel.create(datosValidados);
};

const updateTarifa = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const tarifa = await tarifaModel.update(idNumerico, datosValidados);
    if (!tarifa) {
        throw createHttpError("Tarifa no encontrada", 404);
    }
    return tarifa;
};

const deleteTarifa = async (id) => {
    const idNumerico = validateId(id);
    const tarifa = await tarifaModel.remove(idNumerico);
    if (!tarifa) {
        throw createHttpError("Tarifa no encontrada", 404);
    }
    return tarifa;
};

module.exports = {
    getTarifas,
    getTarifaById,
    createTarifa,
    updateTarifa,
    deleteTarifa
};
