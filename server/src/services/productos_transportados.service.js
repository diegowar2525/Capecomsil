const { createHttpError } = require("../utils/errors/http.error");
const productoTransportadoModel = require("../models/producto_transportado.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/producto_transportado.validators");

const getProductosTransportados = async () => {
    return await productoTransportadoModel.findAll();
};

const getProductoTransportadoById = async (id) => {
    const idNumerico = validateId(id);
    const producto = await productoTransportadoModel.findById(idNumerico);
    if (!producto) {
        throw createHttpError("Producto transportado no encontrado", 404);
    }
    return producto;
};

const createProductoTransportado = async (data) => {
    const datosValidados = validateData(data);
    return await productoTransportadoModel.create(datosValidados);
};

const updateProductoTransportado = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const existingProducto = await productoTransportadoModel.findById(idNumerico);
    if (!existingProducto) {
        throw createHttpError("Producto transportado no encontrado", 404);
    }
    return await productoTransportadoModel.update(idNumerico, datosValidados);
};

const deleteProductoTransportado = async (id) => {
    const idNumerico = validateId(id);
    const producto = await productoTransportadoModel.findById(idNumerico);
    if (!producto) {
        throw createHttpError("Producto transportado no encontrado", 404);
    }
    return await productoTransportadoModel.remove(idNumerico);
};

module.exports = {
    getProductosTransportados,
    getProductoTransportadoById,
    createProductoTransportado,
    updateProductoTransportado,
    deleteProductoTransportado
};
