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

module.exports = { findAll, findById, findDisponibles, create, update };
