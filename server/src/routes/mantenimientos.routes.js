const express = require("express");
const { anularMantenimiento } = require("../controllers/anulaciones.controller");
const {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
} = require("../controllers/mantenimientos.controller");

const router = express.Router();
router.post("/:id/anular", anularMantenimiento);

router.get("/", getMantenimientos);
router.get("/:id", getMantenimientoById);
router.post("/", createMantenimiento);

module.exports = router;
