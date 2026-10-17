const router = require("express").Router();
const controller = require("../controllers/abastecimientos_combustible.controller");

router.get("/", controller.getAbastecimientos);
router.get("/:id", controller.getAbastecimientoById);
router.post("/", controller.createAbastecimiento);
router.post("/:id/anular", controller.anularAbastecimiento);

module.exports = router;
