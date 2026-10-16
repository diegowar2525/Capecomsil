const express = require("express");
const { anularMantenimiento } = require("../controllers/anulaciones.controller");
const {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
} = require("../controllers/mantenimientos.controller");

const router = express.Router();
router.post("/:id/cumplimientos", require("../controllers/mantenimientos.controller").registrarCumplimientos);
router.post("/:id/finalizar", require("../controllers/mantenimientos.controller").finalizarMantenimiento);
router.post("/:id/anular", anularMantenimiento);

router.get("/", getMantenimientos);
router.get("/:id", getMantenimientoById);
router.post("/", createMantenimiento);

module.exports = router;
