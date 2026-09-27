const productoTransportadoModel = require("../models/producto_transportado.model");

const {
    validateId
} = require("../utils/validators/common.validators");

const {
    validateData
} = require("../utils/validators/producto_transportado.validators");

const getProductosTransportados = async () => {
    return await productoTransportadoModel.findAll();
};

const getProductoTransportadoById = async (id) => {
    const idNumerico = validateId(id);

    const producto = await productoTransportadoModel.findById(idNumerico);

    if (!producto) {
        const error = new Error(
            "Producto transportado no encontrado"
        );
        error.status = 404;
        throw error;
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

    const existingProducto =
        await productoTransportadoModel.findById(idNumerico);

    if (!existingProducto) {
        const error = new Error(
            "Producto transportado no encontrado"
        );
        error.status = 404;
        throw error;
    }

    return await productoTransportadoModel.update(
        idNumerico,
        datosValidados
    );
};

const deleteProductoTransportado = async (id) => {
    const idNumerico = validateId(id);

    const producto = await productoTransportadoModel.findById(idNumerico);

    if (!producto) {
        const error = new Error(
            "Producto transportado no encontrado"
        );
        error.status = 404;
        throw error;
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