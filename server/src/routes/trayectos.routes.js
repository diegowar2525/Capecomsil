const express = require("express");
const router = express.Router();

const trayectosController = require("../controllers/trayectos.controller");

router.get("/", trayectosController.getTrayectos);
router.get("/:id", trayectosController.getTrayectoById);
router.post("/", trayectosController.createTrayecto);
router.put("/:id", trayectosController.updateTrayecto);
router.delete("/:id", trayectosController.deleteTrayecto);

module.exports = router;