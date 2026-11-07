const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/informes.controller");
const resumen = require('../controllers/resumen.controller');

router.get('/resumen-mensual', exigirPermiso('informes.consultar'), resumen.getMensual);
router.get('/cuentas-por-cobrar', exigirPermiso('informes.consultar'), resumen.getCuentasPorCobrar);

router.get('/produccion', exigirPermiso('informes.consultar'), require('../controllers/produccion.controller').findAll);
router.get("/viajes", exigirPermiso("informes.consultar"), controller.getViajes);
router.get("/resumen-economico", exigirPermiso("informes.consultar"), controller.getResumen);
router.get("/viaticos", exigirPermiso("informes.consultar"), controller.getViaticos);
router.get("/consumo-combustible", exigirPermiso("informes.consultar"), controller.getCombustible);

module.exports = router;
