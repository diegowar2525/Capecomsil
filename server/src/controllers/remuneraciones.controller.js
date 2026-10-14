const service = require("../services/remuneraciones.service");

const findAll = async (req, res, next) => {
    try {
        const result = await service.findAll(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const result = await service.findById(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const generar = async (req, res, next) => {
    try {
        const result = await service.generar(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const operacionBloqueada = async (req, res, next) => {
    try {
        const result = await service.operacionBloqueada();
        res.status(403).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    findAll, 
    findById, 
    generar, 
    operacionBloqueada 
};
