const router = require("express").Router();
const controller = require("../controllers/gastos.controller");

router.get("/", controller.getGastos);
router.get("/:id", controller.getGastoById);
router.post("/", controller.createGasto);
router.post("/:id/anular", controller.anularGasto);

module.exports = router;
