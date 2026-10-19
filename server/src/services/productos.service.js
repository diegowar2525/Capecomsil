const { createHttpError } = require("../utils/errors/http.error");
const productoModel = require("../models/producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/producto.validators");
const { validateCategoriaActiva } = require("./categorias_producto.service");

const getProductos = async () => {
    return await productoModel.findAll();
};

const getProductoById = async (id) => {
    const idNumerico = validateId(id);
    const producto = await productoModel.findById(idNumerico);
    if (!producto) {
        throw createHttpError("Producto no encontrado", 404);
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
        (await productoModel.hasHistory(idNumerico))
    ) {
        throw createHttpError(
            "No se puede cambiar la unidad de medida de un producto con historial",
            409
        );
    }
    const producto = await productoModel.update(idNumerico, datosValidados);
    if (!producto) {
        throw createHttpError("Producto no encontrado", 404);
    }
    return producto;
};

const deleteProducto = async (id) => {
    const idNumerico = validateId(id);
    await getProductoById(idNumerico);
    if (await productoModel.hasHistory(idNumerico)) {
        throw createHttpError(
            "No se puede eliminar un producto con historial; debe inactivarlo",
            409
        );
    }
    const producto = await productoModel.remove(idNumerico);
    if (!producto) {
        throw createHttpError("Producto no encontrado", 404);
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
