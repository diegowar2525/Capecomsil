const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
} = require("../controllers/vehiculos.controller");

const router = express.Router();
router.get("/:id/kilometraje", exigirPermiso("catalogos.consultar"), require("../controllers/vehiculos.controller").getKilometraje);

router.get("/", exigirPermiso("catalogos.consultar"), getVehiculos);
router.get("/:id", exigirPermiso("catalogos.consultar"), getVehiculoById);
router.post("/", exigirPermiso("catalogos.crear"), createVehiculo);
router.put("/:id", exigirPermiso("catalogos.editar"), updateVehiculo);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteVehiculo);

module.exports = router;
