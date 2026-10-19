const facturasProveedorService = require("../services/facturas_proveedor.service");

const getFacturasProveedor = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.getFacturasProveedor();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getFacturaProveedorById = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.getFacturaProveedorById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createFacturaProveedor = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.createFacturaProveedor(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getRecepciones = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.getRecepciones(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getPendientesRecepcion = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.getPendientesRecepcion(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularFacturaProveedor = async (req, res, next) => {
    try {
        const resultado = await facturasProveedorService.anularFacturaProveedor(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    anularFacturaProveedor,
    getRecepciones,
    getPendientesRecepcion,
    getFacturasProveedor,
    getFacturaProveedorById,
    createFacturaProveedor
};
