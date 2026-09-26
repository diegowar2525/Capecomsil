const proveedoresService = require("../services/proveedores.service");

const getProveedores = async (req, res, next) => {
    try {
        const proveedores = await proveedoresService.getProveedores();

        res.json(proveedores);
    } catch (error) {
        next(error);
    }
};

const getProveedorById = async (req, res, next) => {
    try {
        const proveedor = await proveedoresService.getProveedorById(
            req.params.id
        );

        res.json(proveedor);
    } catch (error) {
        next(error);
    }
};

const createProveedor = async (req, res, next) => {
    try {
        const proveedor = await proveedoresService.createProveedor(
            req.body
        );

        res.status(201).json(proveedor);
    } catch (error) {
        next(error);
    }
};

const updateProveedor = async (req, res, next) => {
    try {
        const proveedor = await proveedoresService.updateProveedor(
            req.params.id,
            req.body
        );

        res.json(proveedor);
    } catch (error) {
        next(error);
    }
};

const deleteProveedor = async (req, res, next) => {
    try {
        const proveedor = await proveedoresService.deleteProveedor(
            req.params.id
        );

        res.json({
            message: "Proveedor eliminado correctamente",
            proveedor
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