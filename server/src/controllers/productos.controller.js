const productosService = require("../services/productos.service");

const getProductos = async (req, res, next) => {
    try {
        const productos = await productosService.getProductos();

        res.json(productos);
    } catch (error) {
        next(error);
    }
};

const getProductoById = async (req, res, next) => {
    try {
        const producto = await productosService.getProductoById(
            req.params.id
        );

        res.json(producto);
    } catch (error) {
        next(error);
    }
};

const createProducto = async (req, res, next) => {
    try {
        const producto = await productosService.createProducto(
            req.body
        );

        res.status(201).json(producto);
    } catch (error) {
        next(error);
    }
};

const updateProducto = async (req, res, next) => {
    try {
        const producto = await productosService.updateProducto(
            req.params.id,
            req.body
        );

        res.json(producto);
    } catch (error) {
        next(error);
    }
};

const deleteProducto = async (req, res, next) => {
    try {
        const producto = await productosService.deleteProducto(
            req.params.id
        );

        res.json({
            message: "Producto eliminado correctamente",
            producto
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