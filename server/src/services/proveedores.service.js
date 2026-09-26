const proveedorModel = require("../models/proveedor.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/proveedor.validators");

const getProveedores = async () => {
    return await proveedorModel.findAll();
};

const getProveedorById = async (id) => {
    validateId(id);

    const proveedor = await proveedorModel.findById(id);

    if (!proveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    return proveedor;
};

const createProveedor = async (data) => {
    validateData(data);

    const proveedorData = {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion ?? null,
        telefono: data.telefono ?? null,
        correo: data.correo ?? null,
        estado: data.estado ?? true
    };

    return await proveedorModel.create(proveedorData);
};

const updateProveedor = async (id, data) => {
    validateId(id);
    validateData(data);

    const existingProveedor = await proveedorModel.findById(id);

    if (!existingProveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    const proveedorData = {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion ?? null,
        telefono: data.telefono ?? null,
        correo: data.correo ?? null,
        estado: data.estado ?? true
    };

    return await proveedorModel.update(id, proveedorData);
};

const deleteProveedor = async (id) => {
    validateId(id);

    const proveedor = await proveedorModel.findById(id);

    if (!proveedor) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
    }

    return await proveedorModel.remove(id);
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};