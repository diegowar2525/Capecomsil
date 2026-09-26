const categoriaProductoModel = require("../models/categoria_producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/categoria_producto.validators");

const getCategoriasProducto = async () => {
    return await categoriaProductoModel.findAll();
};

const getCategoriaProductoById = async (id) => {
    validateId(id);

    const categoria = await categoriaProductoModel.findById(id);

    if (!categoria) {
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
    }

    return categoria;
};

const createCategoriaProducto = async (data) => {
    validateData(data);

    const categoriaData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ?? null,
        estado: data.estado ?? true
    };

    return await categoriaProductoModel.create(categoriaData);
};

const updateCategoriaProducto = async (id, data) => {
    validateId(id);
    validateData(data);

    const existingCategoria = await categoriaProductoModel.findById(id);

    if (!existingCategoria) {
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
    }

    const categoriaData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ?? null,
        estado: data.estado ?? true
    };

    return await categoriaProductoModel.update(id, categoriaData);
};

const deleteCategoriaProducto = async (id) => {
    validateId(id);

    const categoria = await categoriaProductoModel.findById(id);

    if (!categoria) {
        const error = new Error("Categoría de producto no encontrada");
        error.status = 404;
        throw error;
    }

    return await categoriaProductoModel.remove(id);
};

module.exports = {
    getCategoriasProducto,
    getCategoriaProductoById,
    createCategoriaProducto,
    updateCategoriaProducto,
    deleteCategoriaProducto
};