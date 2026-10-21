const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/remuneraciones.controller");
router.get("/", exigirPermiso("remuneraciones.consultar"), controller.findAll);
router.post("/generar", exigirPermiso("remuneraciones.generar"), controller.generar);
router.post("/:id/cerrar", exigirPermiso("cierres.cerrar"), controller.operacionBloqueada);
router.post("/:id/reabrir", exigirPermiso("cierres.reabrir"), controller.operacionBloqueada);
router.get("/:id", exigirPermiso("remuneraciones.consultar"), controller.findById);
module.exports = router;
