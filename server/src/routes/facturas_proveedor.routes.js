const { exigirPermiso } = require("../middlewares/auth.middleware");
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
router.get("/:id/pagos", exigirPermiso("pagos_proveedor.consultar"), getPagosByFactura);
router.get("/", exigirPermiso("compras.consultar"), getFacturasProveedor);
router.get("/:id", exigirPermiso("compras.consultar"), getFacturaProveedorById);
router.get("/:id/recepciones", exigirPermiso("recepciones.consultar"), getRecepciones);
router.get("/:id/pendientes-recepcion", exigirPermiso("recepciones.consultar"), getPendientesRecepcion);
router.post("/", exigirPermiso("compras.crear"), createFacturaProveedor);
router.post("/:id/anular", exigirPermiso("compras.anular"), anularFacturaProveedor);

module.exports = router;
