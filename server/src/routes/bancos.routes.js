const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getBancos,
    getBancoById,
    createBanco,
    updateBanco,
    deleteBanco
} = require("../controllers/bancos.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getBancos);
router.get("/:id", exigirPermiso("catalogos.consultar"), getBancoById);
router.post("/", exigirPermiso("catalogos.crear"), createBanco);
router.put("/:id", exigirPermiso("catalogos.editar"), updateBanco);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteBanco);

module.exports = router;