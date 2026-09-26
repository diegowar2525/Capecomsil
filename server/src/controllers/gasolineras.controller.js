const gasolinerasService = require("../services/gasolineras.service");

const getGasolineras = async (req, res, next) => {
    try {
        const gasolineras = await gasolinerasService.getGasolineras();

        res.json(gasolineras);
    } catch (error) {
        next(error);
    }
};

const getGasolineraById = async (req, res, next) => {
    try {
        const gasolinera = await gasolinerasService.getGasolineraById(
            req.params.id
        );

        res.json(gasolinera);
    } catch (error) {
        next(error);
    }
};

const createGasolinera = async (req, res, next) => {
    try {
        const gasolinera = await gasolinerasService.createGasolinera(
            req.body
        );

        res.status(201).json(gasolinera);
    } catch (error) {
        next(error);
    }
};

const updateGasolinera = async (req, res, next) => {
    try {
        const gasolinera = await gasolinerasService.updateGasolinera(
            req.params.id,
            req.body
        );

        res.json(gasolinera);
    } catch (error) {
        next(error);
    }
};

const deleteGasolinera = async (req, res, next) => {
    try {
        const gasolinera = await gasolinerasService.deleteGasolinera(
            req.params.id
        );

        res.json({
            message: "Gasolinera eliminada correctamente",
            gasolinera
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