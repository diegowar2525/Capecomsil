const { createHttpError } = require("../utils/errors/http.error");
const empresaModel = require("../models/empresa.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/empresa.validators");

const getEmpresas = async () => {
    return await empresaModel.findAll();
};

const getEmpresaById = async (id) => {
    const idNumerico = validateId(id);
    const empresa = await empresaModel.findById(idNumerico);
    if (!empresa) {
        throw createHttpError("Empresa no encontrada", 404);
    }
    return empresa;
};

const createEmpresa = async (data) => {
    const datosValidados = validateData(data);
    return await empresaModel.create(datosValidados);
};

const updateEmpresa = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const empresa = await empresaModel.update(idNumerico, datosValidados);
    if (!empresa) {
        throw createHttpError("Empresa no encontrada", 404);
    }
    return empresa;
};

const deleteEmpresa = async (id) => {
    const idNumerico = validateId(id);
    const empresa = await empresaModel.remove(idNumerico);
    if (!empresa) {
        throw createHttpError("Empresa no encontrada", 404);
    }
    return empresa;
};

module.exports = {
    getEmpresas,
    getEmpresaById,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa
};
