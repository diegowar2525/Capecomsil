const productosService = require("../services/productos.service");

const getProductos = async (req, res, next) => {
    try {
        const resultado = await productosService.getProductos();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getProductoById = async (req, res, next) => {
    try {
        const resultado = await productosService.getProductoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createProducto = async (req, res, next) => {
    try {
        const resultado = await productosService.createProducto(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateProducto = async (req, res, next) => {
    try {
        const resultado = await productosService.updateProducto(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteProducto = async (req, res, next) => {
    try {
        const resultado = await productosService.deleteProducto(req.params.id);
        return res.status(200).json({
            message: "Producto eliminado correctamente",
            producto: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};
