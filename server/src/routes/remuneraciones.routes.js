const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/remuneraciones.controller");
router.get("/", exigirPermiso("remuneraciones.consultar"), controller.findAll);
router.post("/generar", exigirPermiso("remuneraciones.generar"), controller.generar);
router.get("/:id", exigirPermiso("remuneraciones.consultar"), controller.findById);
module.exports = router;
