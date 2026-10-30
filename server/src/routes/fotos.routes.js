const router = require("express").Router();
const controller = require("../controllers/catalogo_foto.controller");
const { autenticar, protegerOperacion, exigirPermiso } = require("../middlewares/auth.middleware");
const { recibirFoto } = require("../middlewares/foto.middleware");

router.use(autenticar);
router.get("/:recurso/:id", exigirPermiso("catalogos.consultar"), protegerOperacion, controller.consultar);
router.put("/:recurso/:id", exigirPermiso("catalogos.editar"), recibirFoto, controller.guardar);
router.delete("/:recurso/:id", exigirPermiso("catalogos.editar"), protegerOperacion, controller.eliminar);

module.exports = router;
