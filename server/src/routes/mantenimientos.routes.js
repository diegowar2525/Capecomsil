const express = require("express");
const {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
} = require("../controllers/mantenimientos.controller");

const router = express.Router();

router.get("/", getMantenimientos);
router.get("/:id", getMantenimientoById);
router.post("/", createMantenimiento);

module.exports = router;
