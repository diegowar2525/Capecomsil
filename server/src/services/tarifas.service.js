const tarifaModel = require("../models/tarifa.model");

const {
    validateId,
    validateData
} = require("../utils/validators/tarifa.validators");

const getTarifas = async () => {
    return await tarifaModel.findAll();
};

const getTarifaById = async (id) => {
    const idNumerico = validateId(id);
    const tarifa = await tarifaModel.findById(idNumerico);

    if (!tarifa) {
        const error = new Error("Tarifa no encontrada");
        error.status = 404;
        throw error;
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

    const tarifa = await tarifaModel.update(
        idNumerico,
        datosValidados
    );

    if (!tarifa) {
        const error = new Error("Tarifa no encontrada");
        error.status = 404;
        throw error;
    }

    return tarifa;
};

const deleteTarifa = async (id) => {
    const idNumerico = validateId(id);

    const tarifa = await tarifaModel.remove(idNumerico);

    if (!tarifa) {
        const error = new Error("Tarifa no encontrada");
        error.status = 404;
        throw error;
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
