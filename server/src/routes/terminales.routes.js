const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getTerminales,
    getTerminalById,
    createTerminal,
    updateTerminal,
    deleteTerminal
} = require("../controllers/terminales.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getTerminales);
router.get("/:id", exigirPermiso("catalogos.consultar"), getTerminalById);
router.post("/", exigirPermiso("catalogos.crear"), createTerminal);
router.put("/:id", exigirPermiso("catalogos.editar"), updateTerminal);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteTerminal);

module.exports = router;