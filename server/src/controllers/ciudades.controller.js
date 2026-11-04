const ciudadesService = require("../services/ciudades.service");

const getCiudades = async (req, res, next) => {
    try {
        const resultado = await ciudadesService.getCiudades();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getCiudadById = async (req, res, next) => {
    try {
        const resultado = await ciudadesService.getCiudadById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createCiudad = async (req, res, next) => {
    try {
        const resultado = await ciudadesService.createCiudad(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateCiudad = async (req, res, next) => {
    try {
        const resultado = await ciudadesService.updateCiudad(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteCiudad = async (req, res, next) => {
    try {
        const resultado = await ciudadesService.deleteCiudad(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCiudades,
    getCiudadById,
    createCiudad,
    updateCiudad,
    deleteCiudad
};
