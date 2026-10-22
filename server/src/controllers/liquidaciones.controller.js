const liquidacionesService = require("../services/liquidaciones.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.findAll(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findDisponibles = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.findDisponibles(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.create(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.update(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const enviar = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.enviar(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const confirmar = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.confirmar(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anular = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.anular(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const resultado = await liquidacionesService.remove(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = { findAll, findById, findDisponibles, create, update, enviar, confirmar, anular, remove };
