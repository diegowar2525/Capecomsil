const router = require("express").Router();
const controller = require("../controllers/modalidades_tarifa.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");
router.get("/", exigirPermiso("tarifas.consultar"), controller.findAll);
router.post("/", exigirPermiso("tarifas.editar"), controller.create);
module.exports = router;
