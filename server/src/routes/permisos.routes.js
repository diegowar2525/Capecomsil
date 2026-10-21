const router = require("express").Router();
const permisosController = require("../controllers/permisos.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/", exigirPermiso("permisos.consultar"), permisosController.findAll);
router.get("/:id", exigirPermiso("permisos.consultar"), permisosController.findById);

module.exports = router;
