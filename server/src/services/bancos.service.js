const { createHttpError } = require("../utils/errors/http.error");
const bancoModel = require("../models/banco.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/banco.validators");

const getBancos = async () => {
    return await bancoModel.findAll();
};

const getBancoById = async (id) => {
    const idNumerico = validateId(id);
    const banco = await bancoModel.findById(idNumerico);
    if (!banco) {
        throw createHttpError("Banco no encontrado", 404);
    }
    return banco;
};

const createBanco = async (data) => {
    const datosValidados = validateData(data);
    return await bancoModel.create(datosValidados);
};

const updateBanco = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const banco = await bancoModel.update(idNumerico, datosValidados);
    if (!banco) {
        throw createHttpError("Banco no encontrado", 404);
    }
    return banco;
};

const deleteBanco = async (id) => {
    const idNumerico = validateId(id);
    const banco = await bancoModel.remove(idNumerico);
    if (!banco) {
        throw createHttpError("Banco no encontrado", 404);
    }
    return banco;
};

module.exports = {
    getBancos,
    getBancoById,
    createBanco,
    updateBanco,
    deleteBanco
};
