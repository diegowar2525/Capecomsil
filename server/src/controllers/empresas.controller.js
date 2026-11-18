const empresasService = require("../services/empresas.service");

const getEmpresas = async (req, res, next) => {
    try {
        const resultado = await empresasService.getEmpresas();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getEmpresaById = async (req, res, next) => {
    try {
        const resultado = await empresasService.getEmpresaById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createEmpresa = async (req, res, next) => {
    try {
        const resultado = await empresasService.createEmpresa(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateEmpresa = async (req, res, next) => {
    try {
        const resultado = await empresasService.updateEmpresa(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteEmpresa = async (req, res, next) => {
    try {
        const resultado = await empresasService.deleteEmpresa(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmpresas,
    getEmpresaById,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa
};
