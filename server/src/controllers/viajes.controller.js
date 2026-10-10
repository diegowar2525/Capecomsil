const viajesService = require("../services/viajes.service");

const createViaje = async (req, res, next) => {
    try {
        res.status(201).json(await viajesService.createViaje(req.body));
    } catch (error) {
        next(error);
    }
};

const getViajes = async (req, res, next) => {
    try {
        res.json(await viajesService.getViajes(req.query));
    } catch (error) {
        next(error);
    }
};

const getViajeById = async (req, res, next) => {
    try {
        res.json(await viajesService.getViajeById(req.params.id));
    } catch (error) {
        next(error);
    }
};

const anularViaje = async (req, res, next) => {
    try {
        res.json(await viajesService.anularViaje(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getViajes, 
    getViajeById, 
    anularViaje, 
    createViaje 
};
