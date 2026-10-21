const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { getPagos, getPagoById, createPago, anularPago } = require("../controllers/pagos_proveedor.controller");

const router = express.Router();
router.get("/", exigirPermiso("pagos_proveedor.consultar"), getPagos);
router.get("/:id", exigirPermiso("pagos_proveedor.consultar"), getPagoById);
router.post("/", exigirPermiso("pagos_proveedor.crear"), createPago);
router.post("/:id/anular", exigirPermiso("pagos_proveedor.anular"), anularPago);

module.exports = router;
