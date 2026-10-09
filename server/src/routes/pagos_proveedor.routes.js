const express = require("express");
const { getPagos, getPagoById, createPago, anularPago } = require("../controllers/pagos_proveedor.controller");

const router = express.Router();
router.get("/", getPagos);
router.get("/:id", getPagoById);
router.post("/", createPago);
router.post("/:id/anular", anularPago);

module.exports = router;
