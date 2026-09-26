const categoriasProductoService = require("../services/categorias_producto.service");

const getCategoriasProducto = async (req, res, next) => {
    try {
        const categorias =
            await categoriasProductoService.getCategoriasProducto();

        res.json(categorias);
    } catch (error) {
        next(error);
    }
};

const getCategoriaProductoById = async (req, res, next) => {
    try {
        const categoria =
            await categoriasProductoService.getCategoriaProductoById(
                req.params.id
            );

        res.json(categoria);
    } catch (error) {
        next(error);
    }
};

const createCategoriaProducto = async (req, res, next) => {
    try {
        const categoria =
            await categoriasProductoService.createCategoriaProducto(
                req.body
            );

        res.status(201).json(categoria);
    } catch (error) {
        next(error);
    }
};

const updateCategoriaProducto = async (req, res, next) => {
    try {
        const categoria =
            await categoriasProductoService.updateCategoriaProducto(
                req.params.id,
                req.body
            );

        res.json(categoria);
    } catch (error) {
        next(error);
    }
};

const deleteCategoriaProducto = async (req, res, next) => {
    try {
        const categoria =
            await categoriasProductoService.deleteCategoriaProducto(
                req.params.id
            );

        res.json({
            message: "Categoría de producto eliminada correctamente",
            categoria
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategoriasProducto,
    getCategoriaProductoById,
    createCategoriaProducto,
    updateCategoriaProducto,
    deleteCategoriaProducto
};