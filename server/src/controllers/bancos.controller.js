const bancosService = require("../services/bancos.service");

const getBancos = async (req, res, next) => {
    try {
        const resultado = await bancosService.getBancos();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getBancoById = async (req, res, next) => {
    try {
        const resultado = await bancosService.getBancoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createBanco = async (req, res, next) => {
    try {
        const resultado = await bancosService.createBanco(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateBanco = async (req, res, next) => {
    try {
        const resultado = await bancosService.updateBanco(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteBanco = async (req, res, next) => {
    try {
        const resultado = await bancosService.deleteBanco(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBancos,
    getBancoById,
    createBanco,
    updateBanco,
    deleteBanco
};
