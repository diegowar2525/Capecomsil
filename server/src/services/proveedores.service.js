const proveedorModel = require("../models/proveedor.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/proveedor.validators");

const getProveedores = async () => {
    return await proveedorModel.findAll();
};

const getProveedorById = async (id) => {
    const idNumerico = validateId(id);

    const proveedor = await proveedorModel.findById(idNumerico);

    if (!proveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    return proveedor;
};

const createProveedor = async (data) => {
    const datosValidados = validateData(data);

    return await proveedorModel.create(datosValidados);
};

const updateProveedor = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);

    const existingProveedor = await proveedorModel.findById(idNumerico);

    if (!existingProveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    return await proveedorModel.update(idNumerico, datosValidados);
};

const deleteProveedor = async (id) => {
    const idNumerico = validateId(id);

    const proveedor = await proveedorModel.findById(idNumerico);

    if (!proveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    return await proveedorModel.remove(idNumerico);
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};