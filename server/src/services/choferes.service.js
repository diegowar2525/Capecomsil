const choferModel = require("../models/chofer.model");
const { validateId, validateData } = require("../utils/validators/vehiculo.validator");

const getChoferes = async () => {
    return await choferModel.findAll();
};

const getChoferById = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.findById(idNumerico);

    if (!chofer) {
        const error = new Error("Chofer no encontrado.");
        error.status = 404;
        throw error;
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

    const chofer = await choferModel.update(
        idNumerico,
        datosValidados
    );

    if (!chofer) {
        const error = new Error("Chofer no encontrado.");
        error.status = 404;
        throw error;
    }

    return chofer;
};

const deleteChofer = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.remove(idNumerico);

    if (!chofer) {
        const error = new Error("Chofer no encontrado.");
        error.status = 404;
        throw error;
    }

    return chofer;
};

module.exports = {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer,
};