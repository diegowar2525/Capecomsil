const configuracionPeajeTrayectoService = require("../services/configuracion_peaje_trayecto.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await configuracionPeajeTrayectoService.findAll();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await configuracionPeajeTrayectoService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const resultado = await configuracionPeajeTrayectoService.create(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const resultado = await configuracionPeajeTrayectoService.update(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const resultado = await configuracionPeajeTrayectoService.remove(req.params.id);
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
