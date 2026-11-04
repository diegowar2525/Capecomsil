const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getCiudades,
    getCiudadById,
    createCiudad,
    updateCiudad,
    deleteCiudad
} = require("../controllers/ciudades.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getCiudades);
router.get("/:id", exigirPermiso("catalogos.consultar"), getCiudadById);
router.post("/", exigirPermiso("catalogos.crear"), createCiudad);
router.put("/:id", exigirPermiso("catalogos.editar"), updateCiudad);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteCiudad);

module.exports = router;