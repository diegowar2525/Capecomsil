const express = require("express");
const { exigirPermiso } = require("../middlewares/auth.middleware");
const controller = require("../controllers/cobros_cliente.controller");
const router = express.Router();
router.get("/", exigirPermiso("cobros_cliente.consultar"), controller.getAll);
router.get("/:id", exigirPermiso("cobros_cliente.consultar"), controller.getById);
router.post("/", exigirPermiso("cobros_cliente.crear"), controller.create);
router.post("/:id/anular", exigirPermiso("cobros_cliente.anular"), controller.anular);
module.exports = router;
