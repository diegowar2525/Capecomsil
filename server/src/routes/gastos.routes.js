const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/gastos.controller");

router.get("/", exigirPermiso("gastos.consultar"), controller.getGastos);
router.get("/:id", exigirPermiso("gastos.consultar"), controller.getGastoById);
router.post("/", exigirPermiso("gastos.crear"), controller.createGasto);
router.post("/:id/anular", exigirPermiso("gastos.anular"), controller.anularGasto);

module.exports = router;
