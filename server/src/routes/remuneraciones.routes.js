const router = require("express").Router();
const controller = require("../controllers/remuneraciones.controller");
router.get("/", controller.findAll);
router.post("/generar", controller.generar);
router.post("/:id/cerrar", controller.operacionBloqueada);
router.post("/:id/reabrir", controller.operacionBloqueada);
router.get("/:id", controller.findById);
module.exports = router;
