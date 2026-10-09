const express = require("express");
const { getPagosByFactura } = require("../controllers/pagos_proveedor.controller");
const {
    getFacturasProveedor,
    anularFacturaProveedor,
    getRecepciones,
    getPendientesRecepcion,
    getFacturaProveedorById,
    createFacturaProveedor
} = require("../controllers/facturas_proveedor.controller");

const router = express.Router();
router.get("/:id/pagos", getPagosByFactura);
router.get("/", getFacturasProveedor);
router.get("/:id", getFacturaProveedorById);
router.get("/:id/recepciones", getRecepciones);
router.get("/:id/pendientes-recepcion", getPendientesRecepcion);
router.post("/", createFacturaProveedor);
router.post("/:id/anular", anularFacturaProveedor);

module.exports = router;
