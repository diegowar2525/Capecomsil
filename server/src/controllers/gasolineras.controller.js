const gasolinerasService = require("../services/gasolineras.service");

const getGasolineras = async (req, res, next) => {
    try {
        const resultado = await gasolinerasService.getGasolineras();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getGasolineraById = async (req, res, next) => {
    try {
        const resultado = await gasolinerasService.getGasolineraById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createGasolinera = async (req, res, next) => {
    try {
        const resultado = await gasolinerasService.createGasolinera(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateGasolinera = async (req, res, next) => {
    try {
        const resultado = await gasolinerasService.updateGasolinera(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteGasolinera = async (req, res, next) => {
    try {
        const resultado = await gasolinerasService.deleteGasolinera(req.params.id);
        return res.status(200).json({
            message: "Gasolinera eliminada correctamente",
            gasolinera: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGasolineras,
    getGasolineraById,
    createGasolinera,
    updateGasolinera,
    deleteGasolinera
};
