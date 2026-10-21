const viajesService = require("../services/viajes.service");
const viajesEdicionService = require("../services/viajes_edicion.service");

const updateViaje = async (req, res, next) => {
    try {
        const resultado = await viajesEdicionService.updateViaje(req.params.id, req.body, req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getHistorialViaje = async (req, res, next) => {
    try {
        const resultado = await viajesEdicionService.getHistorialViaje(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createViaje = async (req, res, next) => {
    try {
        const resultado = await viajesService.createViaje(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getViajes = async (req, res, next) => {
    try {
        const resultado = await viajesService.getViajes(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getViajeById = async (req, res, next) => {
    try {
        const resultado = await viajesService.getViajeById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularViaje = async (req, res, next) => {
    try {
        const resultado = await viajesService.anularViaje(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateViaje,
    getHistorialViaje,
    getViajes,
    getViajeById,
    anularViaje,
    createViaje
};
