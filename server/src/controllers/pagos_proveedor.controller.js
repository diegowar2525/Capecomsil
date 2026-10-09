const service = require("../services/pagos_proveedor.service");

const getPagos = async (req, res, next) => {
    try {
        res.status(200).json(await service.getPagos(req.query));
    } catch (error) {
        next(error);
    }
};

const getPagoById = async (req, res, next) => {
    try {
        res.status(200).json(await service.getPagoById(req.params.id));
    } catch (error) {
        next(error);
    }
};

const getPagosByFactura = async (req, res, next) => {
    try {
        res.status(200).json(await service.getPagosByFactura(req.params.id, req.query));
    } catch (error) {
        next(error);
    }
};

const getCuentasPorPagar = async (req, res, next) => {
    try {
        res.status(200).json(await service.getCuentasPorPagar(req.params.id));
    } catch (error) {
        next(error);
    }
};

const createPago = async (req, res, next) => {
    try {
        res.status(201).json(await service.createPago(req.body));
    } catch (error) {
        next(error);
    }
};

const anularPago = async (req, res, next) => {
    try {
        res.status(200).json(await service.anularPago(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { getPagos, getPagoById, getPagosByFactura, getCuentasPorPagar, createPago, anularPago };
