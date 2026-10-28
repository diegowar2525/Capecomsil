const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const router = express.Router();

const tiposGastoController = require("../controllers/tipos_gasto.controller");

router.get("/", exigirPermiso("catalogos.consultar"), tiposGastoController.getTiposGasto);
router.get("/:id", exigirPermiso("catalogos.consultar"), tiposGastoController.getTipoGastoById);
router.post("/", exigirPermiso("catalogos.crear"), tiposGastoController.createTipoGasto);
router.put("/:id", exigirPermiso("catalogos.editar"), tiposGastoController.updateTipoGasto);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), tiposGastoController.deleteTipoGasto);

module.exports = router;