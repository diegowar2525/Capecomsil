const express = require("express");

const {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer
} = require("../controllers/choferes.controller");

const router = express.Router();

router.get("/", getChoferes);
router.get("/:id", getChoferById);
router.post("/", createChofer);
router.put("/:id", updateChofer);
router.delete("/:id", deleteChofer);

module.exports = router;