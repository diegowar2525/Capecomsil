const proveedoresService = require("../services/proveedores.service");

const getProveedores = async (req, res, next) => {
    try {
        const resultado = await proveedoresService.getProveedores();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getProveedorById = async (req, res, next) => {
    try {
        const resultado = await proveedoresService.getProveedorById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createProveedor = async (req, res, next) => {
    try {
        const resultado = await proveedoresService.createProveedor(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateProveedor = async (req, res, next) => {
    try {
        const resultado = await proveedoresService.updateProveedor(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteProveedor = async (req, res, next) => {
    try {
        const resultado = await proveedoresService.deleteProveedor(req.params.id);
        return res.status(200).json({
            message: "Proveedor eliminado correctamente",
            proveedor: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};
