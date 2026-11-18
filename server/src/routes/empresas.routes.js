const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getEmpresas,
    getEmpresaById,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa
} = require("../controllers/empresas.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getEmpresas);
router.get("/:id", exigirPermiso("catalogos.consultar"), getEmpresaById);
router.post("/", exigirPermiso("catalogos.crear"), createEmpresa);
router.put("/:id", exigirPermiso("catalogos.editar"), updateEmpresa);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteEmpresa);

module.exports = router;