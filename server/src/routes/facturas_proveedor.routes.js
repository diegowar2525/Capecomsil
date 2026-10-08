const express = require("express");
const {
    getFacturasProveedor,
    getRecepciones,
    getPendientesRecepcion,
    getFacturaProveedorById,
    createFacturaProveedor
} = require("../controllers/facturas_proveedor.controller");

const router = express.Router();
router.get("/", getFacturasProveedor);
router.get("/:id", getFacturaProveedorById);
router.get("/:id/recepciones", getRecepciones);
router.get("/:id/pendientes-recepcion", getPendientesRecepcion);
router.post("/", createFacturaProveedor);

module.exports = router;
