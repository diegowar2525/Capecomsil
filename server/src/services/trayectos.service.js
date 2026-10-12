const trayectoModel = require("../models/trayecto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/trayecto.validators");
const { createHttpError } = require("../utils/errors/http.error");

const getTrayectos = async () => {
    return await trayectoModel.findAll();
};

const getTrayectoById = async (id) => {
    const trayecto = await trayectoModel.findById(validateId(id));
    if (!trayecto) throw createHttpError("Trayecto no encontrado", 404);
    return trayecto;
};

const createTrayecto = async (data) => {
    return await trayectoModel.create(validateData(data));
};

const updateTrayecto = async (id, data) => {
    const trayecto = await trayectoModel.update(validateId(id), validateData(data));
    if (!trayecto) throw createHttpError("Trayecto no encontrado", 404);
    return trayecto;
};

const deleteTrayecto = async (id) => {
    const trayecto = await trayectoModel.remove(validateId(id));
    if (!trayecto) throw createHttpError("Trayecto no encontrado", 404);
    return trayecto;
};

module.exports = { getTrayectos, getTrayectoById, createTrayecto, updateTrayecto, deleteTrayecto };
