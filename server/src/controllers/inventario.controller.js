const inventarioService = require("../services/inventario.service");

const getStock = async (req, res, next) => {
    try {
        const resultado = await inventarioService.getStock();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getStockByProducto = async (req, res, next) => {
    try {
        const resultado = await inventarioService.getStockByProducto(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getBajoStock = async (req, res, next) => {
    try {
        const resultado = await inventarioService.getBajoStock();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getMovimientos = async (req, res, next) => {
    try {
        const resultado = await inventarioService.getMovimientos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createAjuste = async (req, res, next) => {
    try {
        const resultado = await inventarioService.createAjuste(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStock,
    getStockByProducto,
    getBajoStock,
    getMovimientos,
    createAjuste
};
