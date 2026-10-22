const router = require("express").Router();
const liquidacionesController = require("../controllers/liquidaciones.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/entregas-disponibles", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findDisponibles);
router.get("/", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findAll);
router.get("/:id", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findById);
router.post("/", exigirPermiso("liquidaciones.crear"), liquidacionesController.create);
router.put("/:id", exigirPermiso("liquidaciones.editar"), liquidacionesController.update);
router.post("/:id/enviar", exigirPermiso("liquidaciones.enviar"), liquidacionesController.enviar);
router.post("/:id/confirmar", exigirPermiso("liquidaciones.confirmar"), liquidacionesController.confirmar);
router.post("/:id/anular", exigirPermiso("liquidaciones.anular"), liquidacionesController.anular);
router.delete("/:id", exigirPermiso("liquidaciones.eliminar"), liquidacionesController.remove);

module.exports = router;
