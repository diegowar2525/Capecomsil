const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer
} = require("../controllers/choferes.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getChoferes);
router.get("/:id", exigirPermiso("catalogos.consultar"), getChoferById);
router.post("/", exigirPermiso("catalogos.crear"), createChofer);
router.put("/:id", exigirPermiso("catalogos.editar"), updateChofer);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteChofer);

module.exports = router;