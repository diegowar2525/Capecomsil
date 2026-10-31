const express = require("express");
const { exigirPermiso } = require("../middlewares/auth.middleware");
const controller = require("../controllers/facturas_cliente.controller");
const router = express.Router();
router.get("/", exigirPermiso("facturas_cliente.consultar"), controller.getAll);
router.get("/:id", exigirPermiso("facturas_cliente.consultar"), controller.getById);
router.post("/", exigirPermiso("facturas_cliente.crear"), controller.create);
router.post("/:id/anular", exigirPermiso("facturas_cliente.anular"), controller.anular);
module.exports = router;
