const express = require("express");
const { createViaje, getViajes, getViajeById, anularViaje } = require("../controllers/viajes.controller");
const router = express.Router();
router.get("/", getViajes);
router.get("/:id", getViajeById);
router.post("/:id/anular", anularViaje);
router.post("/", createViaje);
module.exports = router;
