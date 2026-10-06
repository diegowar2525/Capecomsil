const mantenimientosService = require("../services/mantenimientos.service");

const getMantenimientos = async (req, res, next) => {
    try {
        const mantenimientos = await mantenimientosService.getMantenimientos();
        res.json(mantenimientos);
    } catch (error) {
        next(error);
    }
};

const getMantenimientoById = async (req, res, next) => {
    try {
        const mantenimiento = await mantenimientosService.getMantenimientoById(req.params.id);
        res.json(mantenimiento);
    } catch (error) {
        next(error);
    }
};

const createMantenimiento = async (req, res, next) => {
    try {
        const mantenimiento = await mantenimientosService.createMantenimiento(req.body);
        res.status(201).json(mantenimiento);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
};
