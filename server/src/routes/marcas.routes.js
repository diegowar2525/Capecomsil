const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getMarcas,
    getMarcaById,
    createMarca,
    updateMarca,
    deleteMarca
} = require("../controllers/marcas.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getMarcas);
router.get("/:id", exigirPermiso("catalogos.consultar"), getMarcaById);
router.post("/", exigirPermiso("catalogos.crear"), createMarca);
router.put("/:id", exigirPermiso("catalogos.editar"), updateMarca);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteMarca);

module.exports = router;