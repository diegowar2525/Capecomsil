const modelosService = require("../services/modelos.service");

const getModelos = async (req, res, next) => {
    try {
        const resultado = await modelosService.getModelos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getModeloById = async (req, res, next) => {
    try {
        const resultado = await modelosService.getModeloById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createModelo = async (req, res, next) => {
    try {
        const resultado = await modelosService.createModelo(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateModelo = async (req, res, next) => {
    try {
        const resultado = await modelosService.updateModelo(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteModelo = async (req, res, next) => {
    try {
        const resultado = await modelosService.deleteModelo(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getModelos,
    getModeloById,
    createModelo,
    updateModelo,
    deleteModelo
};
