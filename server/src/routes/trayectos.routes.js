const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const router = express.Router();

const trayectosController = require("../controllers/trayectos.controller");

router.get("/", exigirPermiso("catalogos.consultar"), trayectosController.getTrayectos);
router.get("/:id", exigirPermiso("catalogos.consultar"), trayectosController.getTrayectoById);
router.post("/", exigirPermiso("catalogos.crear"), trayectosController.createTrayecto);
router.put("/:id", exigirPermiso("catalogos.editar"), trayectosController.updateTrayecto);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), trayectosController.deleteTrayecto);

module.exports = router;