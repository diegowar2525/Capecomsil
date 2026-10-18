const router = require("express").Router();
const controller = require("../controllers/informes.controller");

router.get("/viajes", controller.getViajes);
router.get("/resumen-economico", controller.getResumen);
router.get("/viaticos", controller.getViaticos);
router.get("/consumo-combustible", controller.getCombustible);

module.exports = router;
