const router = require("express").Router();
const controller = require("../controllers/tarifas_capacidad.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");
router.get("/", exigirPermiso("tarifas.consultar"), controller.findAll);
router.get("/:id", exigirPermiso("tarifas.consultar"), controller.findById);
router.post("/", exigirPermiso("tarifas.crear"), controller.create);
router.put("/:id", exigirPermiso("tarifas.editar"), controller.update);
router.delete("/:id", exigirPermiso("tarifas.eliminar"), controller.remove);
module.exports = router;
