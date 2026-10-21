const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { createViaje, getViajes, getViajeById, anularViaje } = require("../controllers/viajes.controller");
const router = express.Router();
router.get("/", exigirPermiso("viajes.consultar"), getViajes);
router.get("/:id", exigirPermiso("viajes.consultar"), getViajeById);
router.post("/:id/anular", exigirPermiso("viajes.anular"), anularViaje);
router.post("/", exigirPermiso("viajes.crear"), createViaje);
module.exports = router;
