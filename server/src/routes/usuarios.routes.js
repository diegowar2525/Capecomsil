const router = require("express").Router();
const usuariosController = require("../controllers/usuarios.controller");
const { exigirPermiso } = require("../middlewares/auth.middleware");

router.get("/", exigirPermiso("usuarios.consultar"), usuariosController.findAll);
router.get("/:id", exigirPermiso("usuarios.consultar"), usuariosController.findById);

module.exports = router;
