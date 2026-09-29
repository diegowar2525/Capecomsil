const express = require("express");
const {
    getFacturasProveedor,
    getFacturaProveedorById,
    createFacturaProveedor
} = require("../controllers/facturas_proveedor.controller");

const router = express.Router();
router.get("/", getFacturasProveedor);
router.get("/:id", getFacturaProveedorById);
router.post("/", createFacturaProveedor);

module.exports = router;
