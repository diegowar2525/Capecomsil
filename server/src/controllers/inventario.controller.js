const inventarioService = require("../services/inventario.service");

const getStock = async (req, res, next) => {
    try {
        res.json(await inventarioService.getStock());
    } catch (error) {
        next(error);
    }
};

const getStockByProducto = async (req, res, next) => {
    try {
        res.json(await inventarioService.getStockByProducto(req.params.id));
    } catch (error) {
        next(error);
    }
};

const getBajoStock = async (req, res, next) => {
    try {
        res.json(await inventarioService.getBajoStock());
    } catch (error) {
        next(error);
    }
};

const getMovimientos = async (req, res, next) => {
    try {
        res.json(await inventarioService.getMovimientos(req.query));
    } catch (error) {
        next(error);
    }
};

const createAjuste = async (req, res, next) => {
    try {
        res.status(201).json(await inventarioService.createAjuste(req.body));
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
