const router = require("express").Router();
const liquidacionesController = require("../controllers/liquidaciones.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/entregas-disponibles", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findDisponibles);
router.get("/", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findAll);
router.get("/:id", exigirPermiso("liquidaciones.consultar"), liquidacionesController.findById);
router.post("/", exigirPermiso("liquidaciones.crear"), liquidacionesController.create);
router.put("/:id", exigirPermiso("liquidaciones.editar"), liquidacionesController.update);

module.exports = router;
