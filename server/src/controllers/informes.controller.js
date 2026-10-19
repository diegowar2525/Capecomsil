const informesService = require("../services/informes.service");

const getViajes = async (req, res, next) => {
    try {
        const resultado = await informesService.getViajes(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getResumen = async (req, res, next) => {
    try {
        const resultado = await informesService.getResumen(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getViaticos = async (req, res, next) => {
    try {
        const resultado = await informesService.getViaticos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getCombustible = async (req, res, next) => {
    try {
        const resultado = await informesService.getCombustible(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getViajes,
    getResumen,
    getViaticos,
    getCombustible
};
