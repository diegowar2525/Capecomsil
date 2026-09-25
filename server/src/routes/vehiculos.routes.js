const express = require("express");

const {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
} = require("../controllers/vehiculos.controller");

const router = express.Router();

router.get("/", getVehiculos);
router.get("/:id", getVehiculoById);
router.post("/", createVehiculo);
router.put("/:id", updateVehiculo);
router.delete("/:id", deleteVehiculo);

module.exports = router;