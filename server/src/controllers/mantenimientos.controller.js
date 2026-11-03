const mantenimientosService = require("../services/mantenimientos.service");
const { createHttpError } = require('../utils/errors/http.error');

const getMantenimientos = async (req, res, next) => {
    try {
        const resultado = await mantenimientosService.getMantenimientos();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getMantenimientoById = async (req, res, next) => {
    try {
        const resultado = await mantenimientosService.getMantenimientoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createMantenimiento = async (req, res, next) => {
    try {
        if (req.body?.modalidad_pago === 'NUEVA' && !req.auth.permisos.includes('compras.crear')) {
            throw createHttpError('No tiene permiso para crear facturas de proveedores',403);
        }
        const resultado = await mantenimientosService.createMantenimiento(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const registrarCumplimientos = async (req, res, next) => {
    try {
        const resultado = await mantenimientosService.registrarCumplimientos(
            req.params.id,
            req.body
        );
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const finalizarMantenimiento = async (req, res, next) => {
    try {
        const resultado = await mantenimientosService.finalizarMantenimiento(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registrarCumplimientos,
    finalizarMantenimiento,
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
};
