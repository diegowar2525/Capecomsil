const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getProvincias,
    getProvinciaById,
    createProvincia,
    updateProvincia,
    deleteProvincia
} = require("../controllers/provincias.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getProvincias);
router.get("/:id", exigirPermiso("catalogos.consultar"), getProvinciaById);
router.post("/", exigirPermiso("catalogos.crear"), createProvincia);
router.put("/:id", exigirPermiso("catalogos.editar"), updateProvincia);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteProvincia);

module.exports = router;