const categoriaProductoModel = require("../models/categoria_producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/categoria_producto.validators");

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
    deleteCategoriaProducto
};