const categoriasProductoService = require("../services/categorias_producto.service");

const getCategoriasProducto = async (req, res, next) => {
    try {
        const resultado = await categoriasProductoService.getCategoriasProducto();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getCategoriaProductoById = async (req, res, next) => {
    try {
        const resultado = await categoriasProductoService.getCategoriaProductoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createCategoriaProducto = async (req, res, next) => {
    try {
        const resultado = await categoriasProductoService.createCategoriaProducto(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateCategoriaProducto = async (req, res, next) => {
    try {
        const resultado = await categoriasProductoService.updateCategoriaProducto(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteCategoriaProducto = async (req, res, next) => {
    try {
        const resultado = await categoriasProductoService.deleteCategoriaProducto(req.params.id);
        return res.status(200).json({
            message: "Categoría de producto eliminada correctamente",
            categoria: resultado
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
