const router = require("express").Router();
const rolesController = require("../controllers/roles.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/", exigirPermiso("roles.consultar"), rolesController.findAll);
router.get("/:id", exigirPermiso("roles.consultar"), rolesController.findById);
router.get("/:id/permisos", exigirPermiso("permisos.consultar"), rolesController.findPermisos);

module.exports = router;
