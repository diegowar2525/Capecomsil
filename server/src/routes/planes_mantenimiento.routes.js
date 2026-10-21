const { exigirPermiso } = require("../middlewares/auth.middleware");
const router = require("express").Router();
const controller = require("../controllers/planes_mantenimiento.controller");
router.get("/", exigirPermiso("planes_mantenimiento.consultar"), controller.findAll);
router.post("/", exigirPermiso("planes_mantenimiento.crear"), controller.create);
router.put("/:id", exigirPermiso("planes_mantenimiento.editar"), controller.update);
router.delete("/:id", exigirPermiso("planes_mantenimiento.eliminar"), controller.remove);
router.get("/:id", exigirPermiso("planes_mantenimiento.consultar"), controller.findById);
module.exports = router;
