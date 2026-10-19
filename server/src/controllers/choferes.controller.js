const choferesService = require("../services/choferes.service");

const getChoferes = async (req, res, next) => {
    try {
        const resultado = await choferesService.getChoferes();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getChoferById = async (req, res, next) => {
    try {
        const resultado = await choferesService.getChoferById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createChofer = async (req, res, next) => {
    try {
        const resultado = await choferesService.createChofer(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateChofer = async (req, res, next) => {
    try {
        const resultado = await choferesService.updateChofer(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteChofer = async (req, res, next) => {
    try {
        const resultado = await choferesService.deleteChofer(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer
};
