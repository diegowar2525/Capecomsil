const provinciasService = require("../services/provincias.service");

const getProvincias = async (req, res, next) => {
    try {
        const resultado = await provinciasService.getProvincias();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getProvinciaById = async (req, res, next) => {
    try {
        const resultado = await provinciasService.getProvinciaById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createProvincia = async (req, res, next) => {
    try {
        const resultado = await provinciasService.createProvincia(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateProvincia = async (req, res, next) => {
    try {
        const resultado = await provinciasService.updateProvincia(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteProvincia = async (req, res, next) => {
    try {
        const resultado = await provinciasService.deleteProvincia(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProvincias,
    getProvinciaById,
    createProvincia,
    updateProvincia,
    deleteProvincia
};
