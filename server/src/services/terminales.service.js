const { createHttpError } = require("../utils/errors/http.error");
const terminalModel = require("../models/terminal.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/terminal.validators");

const getTerminales = async () => {
    return await terminalModel.findAll();
};

const getTerminalById = async (id) => {
    const idNumerico = validateId(id);
    const terminal = await terminalModel.findById(idNumerico);
    if (!terminal) {
        throw createHttpError("Terminal no encontrado", 404);
    }
    return terminal;
};

const createTerminal = async (data) => {
    const datosValidados = validateData(data);
    return await terminalModel.create(datosValidados);
};

const updateTerminal = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const terminal = await terminalModel.update(idNumerico, datosValidados);
    if (!terminal) {
        throw createHttpError("Terminal no encontrado", 404);
    }
    return terminal;
};

const deleteTerminal = async (id) => {
    const idNumerico = validateId(id);
    const terminal = await terminalModel.remove(idNumerico);
    if (!terminal) {
        throw createHttpError("Terminal no encontrado", 404);
    }
    return terminal;
};

module.exports = {
    getTerminales,
    getTerminalById,
    createTerminal,
    updateTerminal,
    deleteTerminal
};
