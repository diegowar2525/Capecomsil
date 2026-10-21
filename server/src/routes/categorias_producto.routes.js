const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const router = express.Router();

const categoriasProductoController = require("../controllers/categorias_producto.controller");

router.get("/", exigirPermiso("catalogos.consultar"), categoriasProductoController.getCategoriasProducto);
router.get("/:id", exigirPermiso("catalogos.consultar"), categoriasProductoController.getCategoriaProductoById);
router.post("/", exigirPermiso("catalogos.crear"), categoriasProductoController.createCategoriaProducto);
router.put("/:id", exigirPermiso("catalogos.editar"), categoriasProductoController.updateCategoriaProducto);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), categoriasProductoController.deleteCategoriaProducto);

module.exports = router;