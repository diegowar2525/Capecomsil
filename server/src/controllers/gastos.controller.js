const service = require("../services/gastos.service");

const getGastos = async (req, res, next) => {
    try {
        res.status(200).json(await service.getGastos(req.query));
    } catch (error) {
        next(error);
    }
};

const getGastoById = async (req, res, next) => {
    try {
        res.status(200).json(await service.getGastoById(req.params.id));
    } catch (error) {
        next(error);
    }
};

const createGasto = async (req, res, next) => {
    try {
        res.status(201).json(await service.createGasto(req.body));
    } catch (error) {
        next(error);
    }
};

const anularGasto = async (req, res, next) => {
    try {
        res.status(200).json(await service.anularGasto(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { getGastos, getGastoById, createGasto, anularGasto };
