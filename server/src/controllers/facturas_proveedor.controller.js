const facturasProveedorService = require("../services/facturas_proveedor.service");

const getFacturasProveedor = async (req, res, next) => {
    try {
        const facturas = await facturasProveedorService.getFacturasProveedor();
        res.json(facturas);
    } catch (error) {
        next(error);
    }
};

const getFacturaProveedorById = async (req, res, next) => {
    try {
        const factura = await facturasProveedorService.getFacturaProveedorById(req.params.id);
        res.json(factura);
    } catch (error) {
        next(error);
    }
};

const createFacturaProveedor = async (req, res, next) => {
    try {
        const factura = await facturasProveedorService.createFacturaProveedor(req.body);
        res.status(201).json(factura);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getFacturasProveedor, 
    getFacturaProveedorById, 
    createFacturaProveedor 
};
