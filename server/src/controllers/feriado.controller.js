const feriadoService = require("../services/feriado.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await feriadoService.findAll();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await feriadoService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const resultado = await feriadoService.create(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const resultado = await feriadoService.update(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const resultado = await feriadoService.remove(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
