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
    validateId(id);

    const producto = await productoTransportadoModel.findById(id);

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
    validateData(data);

    const productoData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ?? null,
        unidad_medida: data.unidad_medida.trim(),
        estado: data.estado ?? true
    };

    return await productoTransportadoModel.create(productoData);
};

const updateProductoTransportado = async (id, data) => {
    validateId(id);
    validateData(data);

    const existingProducto =
        await productoTransportadoModel.findById(id);

    if (!existingProducto) {
        const error = new Error(
            "Producto transportado no encontrado"
        );
        error.status = 404;
        throw error;
    }

    const productoData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ?? null,
        unidad_medida: data.unidad_medida.trim(),
        estado: data.estado ?? true
    };

    return await productoTransportadoModel.update(
        id,
        productoData
    );
};

const deleteProductoTransportado = async (id) => {
    validateId(id);

    const producto = await productoTransportadoModel.findById(id);

    if (!producto) {
        const error = new Error(
            "Producto transportado no encontrado"
        );
        error.status = 404;
        throw error;
    }

    return await productoTransportadoModel.remove(id);
};

module.exports = {
    getProductosTransportados,
    getProductoTransportadoById,
    createProductoTransportado,
    updateProductoTransportado,
    deleteProductoTransportado
};