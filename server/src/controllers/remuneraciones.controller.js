const remuneracionesService = require("../services/remuneraciones.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await remuneracionesService.findAll(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await remuneracionesService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const generar = async (req, res, next) => {
    try {
        const resultado = await remuneracionesService.generar(req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const cobertura = async (req, res, next) => {
    try { return res.status(200).json(await remuneracionesService.cobertura(req.query)); }
    catch (error) { next(error); }
};

module.exports = {
    cobertura,
    findAll,
    findById,
    generar
};
