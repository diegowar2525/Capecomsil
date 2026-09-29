const categoriaProductoModel = require("../models/categoria_producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/categoria_producto.validators");

const validateCategoriaActiva = async (id) => {
    const categoria = await categoriaProductoModel.findById(id);

    if (!categoria) {
        const error = new Error("La categoría indicada no existe");
        error.status = 400;
        throw error;
    }

    if (categoria.estado !== true) {
        const error = new Error("La categoría seleccionada debe estar activa");
        error.status = 409;
        throw error;
    }
};

const getCategoriasProducto = async () => {
    return await categoriaProductoModel.findAll();
};

const getCategoriaProductoById = async (id) => {
    const idNumerico = validateId(id);

    const categoria = await categoriaProductoModel.findById(idNumerico);

    if (!categoria) {
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
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
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
    }

    return await categoriaProductoModel.update(idNumerico, datosValidados);
};

const deleteCategoriaProducto = async (id) => {
    const idNumerico = validateId(id);

    const categoria = await categoriaProductoModel.findById(idNumerico);

    if (!categoria) {
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
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