const productoModel = require("../models/producto.model");

const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/producto.validators");
const { validateCategoriaActiva } = require("../services/categorias_producto.service");

const getProductos = async () => {
    return await productoModel.findAll();
};

const getProductoById = async (id) => {
    const idNumerico = validateId(id);
    const producto = await productoModel.findById(idNumerico);

    if (!producto) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
    }

    return producto;
};

const createProducto = async (data) => {
    const datosValidados = validateData(data);
    await validateCategoriaActiva(datosValidados.id_categoria);
    return await productoModel.create(datosValidados);
};

const updateProducto = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);

    const productoExistente = await getProductoById(idNumerico);

    if (productoExistente.id_categoria !== datosValidados.id_categoria) {
        await validateCategoriaActiva(datosValidados.id_categoria);
    }

    if (
        productoExistente.unidad_medida !== datosValidados.unidad_medida &&
        await productoModel.hasHistory(idNumerico)
    ) {
        const error = new Error("No se puede cambiar la unidad de medida de un producto con historial");
        error.status = 409;
        throw error;
    }

    const producto = await productoModel.update(
        idNumerico,
        datosValidados
    );

    if (!producto) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
    }

    return producto;
};

const deleteProducto = async (id) => {
    const idNumerico = validateId(id);
    await getProductoById(idNumerico);

    if (await productoModel.hasHistory(idNumerico)) {
        const error = new Error("No se puede eliminar un producto con historial; debe inactivarlo");
        error.status = 409;
        throw error;
    }

    const producto = await productoModel.remove(idNumerico);

    if (!producto) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
    }

    return producto;
};

module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};
