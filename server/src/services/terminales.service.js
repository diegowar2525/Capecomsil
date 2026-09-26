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
        const error = new Error("Terminal no encontrado");
        error.status = 404;
        throw error;
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

    const terminal = await terminalModel.update(
        idNumerico,
        datosValidados
    );

    if (!terminal) {
        const error = new Error("Terminal no encontrado");
        error.status = 404;
        throw error;
    }

    return terminal;
};

const deleteTerminal = async (id) => {
    const idNumerico = validateId(id);
    const terminal = await terminalModel.remove(idNumerico);

    if (!terminal) {
        const error = new Error("Terminal no encontrado");
        error.status = 404;
        throw error;
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