const { createHttpError } = require("../utils/errors/http.error");
const categoriaProductoModel = require("../models/categoria_producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/categoria_producto.validators");

const validateCategoriaActiva = async (id) => {
    const categoria = await categoriaProductoModel.findById(id);
    if (!categoria) {
        throw createHttpError("La categoría indicada no existe", 400);
    }
    if (categoria.estado !== true) {
        throw createHttpError("La categoría seleccionada debe estar activa", 409);
    }
};

const getCategoriasProducto = async () => {
    return await categoriaProductoModel.findAll();
};

const getCategoriaProductoById = async (id) => {
    const idNumerico = validateId(id);
    const categoria = await categoriaProductoModel.findById(idNumerico);
    if (!categoria) {
        throw createHttpError("Categoría de producto no encontrada", 404);
    }
    return categoria;
};

const createCategoriaProducto = async (data) => {
    const datosValidados = validateData(data);
    return await categoriaProductoModel.create(datosValidados);
};

const updateCategoriaProducto = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const existingCategoria = await categoriaProductoModel.findById(idNumerico);
    if (!existingCategoria) {
        throw createHttpError("Categoría de producto no encontrada", 404);
    }
    return await categoriaProductoModel.update(idNumerico, datosValidados);
};

const deleteCategoriaProducto = async (id) => {
    const idNumerico = validateId(id);
    const categoria = await categoriaProductoModel.findById(idNumerico);
    if (!categoria) {
        throw createHttpError("Categoría de producto no encontrada", 404);
    }
    return await categoriaProductoModel.remove(idNumerico);
};

module.exports = {
    getCategoriasProducto,
    getCategoriaProductoById,
    createCategoriaProducto,
    updateCategoriaProducto,
    deleteCategoriaProducto,
    validateCategoriaActiva
};
