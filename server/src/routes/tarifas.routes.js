const express = require("express");

const {
    getTarifas,
    getTarifaById,
    createTarifa,
    updateTarifa,
    deleteTarifa
} = require("../controllers/tarifas.controller");

const router = express.Router();

router.get("/", getTarifas);
router.get("/:id", getTarifaById);
router.post("/", createTarifa);
router.put("/:id", updateTarifa);
router.delete("/:id", deleteTarifa);

module.exports = router;