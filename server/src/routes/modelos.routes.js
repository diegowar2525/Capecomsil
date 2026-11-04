const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getModelos,
    getModeloById,
    createModelo,
    updateModelo,
    deleteModelo
} = require("../controllers/modelos.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getModelos);
router.get("/:id", exigirPermiso("catalogos.consultar"), getModeloById);
router.post("/", exigirPermiso("catalogos.crear"), createModelo);
router.put("/:id", exigirPermiso("catalogos.editar"), updateModelo);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteModelo);

module.exports = router;