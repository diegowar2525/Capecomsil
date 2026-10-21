const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const router = express.Router();

const gasolinerasController = require("../controllers/gasolineras.controller");

router.get("/", exigirPermiso("catalogos.consultar"), gasolinerasController.getGasolineras);
router.get("/:id", exigirPermiso("catalogos.consultar"), gasolinerasController.getGasolineraById);
router.post("/", exigirPermiso("catalogos.crear"), gasolinerasController.createGasolinera);
router.put("/:id", exigirPermiso("catalogos.editar"), gasolinerasController.updateGasolinera);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), gasolinerasController.deleteGasolinera);

module.exports = router;