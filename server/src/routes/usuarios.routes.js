const router = require("express").Router();
const usuariosController = require("../controllers/usuarios.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/", exigirPermiso("usuarios.consultar"), usuariosController.findAll);
router.get("/:id", exigirPermiso("usuarios.consultar"), usuariosController.findById);

router.get("/:id/historial", exigirPermiso("usuarios.consultar"), usuariosController.findHistorial);
router.post("/", exigirPermiso("usuarios.crear"), usuariosController.create);
router.put("/:id", exigirPermiso("usuarios.editar"), usuariosController.update);
router.patch("/:id/estado", exigirPermiso("usuarios.desactivar"), usuariosController.updateEstado);
router.post("/:id/restablecer-password", exigirPermiso("usuarios.restablecer_credenciales"), usuariosController.resetPassword);

module.exports = router;
