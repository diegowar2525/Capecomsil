const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/configuracion_remuneracion.controller");
router.get("/", exigirPermiso("configuraciones.consultar"), controller.findAll);
router.post("/", exigirPermiso("configuraciones.crear"), controller.create);
router.put("/:id", exigirPermiso("configuraciones.editar"), controller.update);
router.delete("/:id", exigirPermiso("configuraciones.eliminar"), controller.remove);
router.get("/:id", exigirPermiso("configuraciones.consultar"), controller.findById);
module.exports = router;
