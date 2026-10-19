const pagosProveedorService = require("../services/pagos_proveedor.service");

const getPagos = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.getPagos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getPagoById = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.getPagoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getPagosByFactura = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.getPagosByFactura(req.params.id, req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getCuentasPorPagar = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.getCuentasPorPagar(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createPago = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.createPago(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularPago = async (req, res, next) => {
    try {
        const resultado = await pagosProveedorService.anularPago(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPagos,
    getPagoById,
    getPagosByFactura,
    getCuentasPorPagar,
    createPago,
    anularPago
};
