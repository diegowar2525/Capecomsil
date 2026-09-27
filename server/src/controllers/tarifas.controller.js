const tarifasService = require("../services/tarifas.service");

const getTarifas = async (req, res, next) => {
    try {
        const tarifas = await tarifasService.getTarifas();

        res.json(tarifas);
    } catch (error) {
        next(error);
    }
};

const getTarifaById = async (req, res, next) => {
    try {
        const tarifa = await tarifasService.getTarifaById(
            req.params.id
        );

        res.json(tarifa);
    } catch (error) {
        next(error);
    }
};

const createTarifa = async (req, res, next) => {
    try {
        const tarifa = await tarifasService.createTarifa(
            req.body
        );

        res.status(201).json(tarifa);
    } catch (error) {
        next(error);
    }
};

const updateTarifa = async (req, res, next) => {
    try {
        const tarifa = await tarifasService.updateTarifa(
            req.params.id,
            req.body
        );

        res.json(tarifa);
    } catch (error) {
        next(error);
    }
};

const deleteTarifa = async (req, res, next) => {
    try {
        const tarifa = await tarifasService.deleteTarifa(
            req.params.id
        );

        res.json({
            message: "Tarifa eliminada correctamente",
            tarifa
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTarifas,
    getTarifaById,
    createTarifa,
    updateTarifa,
    deleteTarifa
};