const service = require("../services/abastecimientos_combustible.service");

const getAbastecimientos = async (req, res, next) => {
    try {
        res.status(200).json(await service.getAbastecimientos(req.query));
    } catch (error) {
        next(error);
    }
};

const getAbastecimientoById = async (req, res, next) => {
    try {
        res.status(200).json(await service.getAbastecimientoById(req.params.id));
    } catch (error) {
        next(error);
    }
};

const createAbastecimiento = async (req, res, next) => {
    try {
        res.status(201).json(await service.createAbastecimiento(req.body));
    } catch (error) {
        next(error);
    }
};

const anularAbastecimiento = async (req, res, next) => {
    try {
        res.status(200).json(await service.anularAbastecimiento(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { getAbastecimientos, getAbastecimientoById, createAbastecimiento, anularAbastecimiento };
