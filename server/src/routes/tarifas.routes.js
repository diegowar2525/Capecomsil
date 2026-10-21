const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getTarifas,
    getTarifaById,
    createTarifa,
    updateTarifa,
    deleteTarifa
} = require("../controllers/tarifas.controller");

const router = express.Router();

router.get("/", exigirPermiso("tarifas.consultar"), getTarifas);
router.get("/:id", exigirPermiso("tarifas.consultar"), getTarifaById);
router.post("/", exigirPermiso("tarifas.crear"), createTarifa);
router.put("/:id", exigirPermiso("tarifas.editar"), updateTarifa);
router.delete("/:id", exigirPermiso("tarifas.eliminar"), deleteTarifa);

module.exports = router;