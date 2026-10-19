const gastosService = require("../services/gastos.service");

const getGastos = async (req, res, next) => {
    try {
        const resultado = await gastosService.getGastos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getGastoById = async (req, res, next) => {
    try {
        const resultado = await gastosService.getGastoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createGasto = async (req, res, next) => {
    try {
        const resultado = await gastosService.createGasto(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularGasto = async (req, res, next) => {
    try {
        const resultado = await gastosService.anularGasto(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGastos,
    getGastoById,
    createGasto,
    anularGasto
};
