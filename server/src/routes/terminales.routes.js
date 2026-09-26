const express = require("express");

const {
    getTerminales,
    getTerminalById,
    createTerminal,
    updateTerminal,
    deleteTerminal
} = require("../controllers/terminales.controller");

const router = express.Router();

router.get("/", getTerminales);
router.get("/:id", getTerminalById);
router.post("/", createTerminal);
router.put("/:id", updateTerminal);
router.delete("/:id", deleteTerminal);

module.exports = router;