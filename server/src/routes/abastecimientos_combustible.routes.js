const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/abastecimientos_combustible.controller");

router.get("/", exigirPermiso("abastecimientos.consultar"), controller.getAbastecimientos);
router.get("/:id", exigirPermiso("abastecimientos.consultar"), controller.getAbastecimientoById);
router.post("/", exigirPermiso("abastecimientos.crear"), controller.createAbastecimiento);
router.post("/:id/anular", exigirPermiso("abastecimientos.anular"), controller.anularAbastecimiento);

module.exports = router;
