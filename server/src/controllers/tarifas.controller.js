const tarifasService = require("../services/tarifas.service");

const getTarifas = async (req, res, next) => {
    try {
        const resultado = await tarifasService.getTarifas();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getTarifaById = async (req, res, next) => {
    try {
        const resultado = await tarifasService.getTarifaById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createTarifa = async (req, res, next) => {
    try {
        const resultado = await tarifasService.createTarifa(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateTarifa = async (req, res, next) => {
    try {
        const resultado = await tarifasService.updateTarifa(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteTarifa = async (req, res, next) => {
    try {
        const resultado = await tarifasService.deleteTarifa(req.params.id);
        return res.status(200).json({
            message: "Tarifa eliminada correctamente",
            tarifa: resultado
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
