const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { anularMantenimiento } = require("../controllers/anulaciones.controller");
const {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
} = require("../controllers/mantenimientos.controller");

const router = express.Router();
router.post("/:id/cumplimientos", exigirPermiso("mantenimientos.registrar_cumplimientos"), require("../controllers/mantenimientos.controller").registrarCumplimientos);
router.post("/:id/finalizar", exigirPermiso("mantenimientos.finalizar"), require("../controllers/mantenimientos.controller").finalizarMantenimiento);
router.post("/:id/anular", exigirPermiso("mantenimientos.anular"), anularMantenimiento);

router.get("/", exigirPermiso("mantenimientos.consultar"), getMantenimientos);
router.get("/:id", exigirPermiso("mantenimientos.consultar"), getMantenimientoById);
router.post("/", exigirPermiso("mantenimientos.crear"), createMantenimiento);

module.exports = router;
