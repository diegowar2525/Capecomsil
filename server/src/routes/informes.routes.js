const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/informes.controller");

router.get("/viajes", exigirPermiso("informes.consultar"), controller.getViajes);
router.get("/resumen-economico", exigirPermiso("informes.consultar"), controller.getResumen);
router.get("/viaticos", exigirPermiso("informes.consultar"), controller.getViaticos);
router.get("/consumo-combustible", exigirPermiso("informes.consultar"), controller.getCombustible);

module.exports = router;
