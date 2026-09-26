const express = require("express");
const router = express.Router();

const categoriasProductoController = require("../controllers/categorias_producto.controller");

router.get("/", categoriasProductoController.getCategoriasProducto);
router.get("/:id", categoriasProductoController.getCategoriaProductoById);
router.post("/", categoriasProductoController.createCategoriaProducto);
router.put("/:id", categoriasProductoController.updateCategoriaProducto);
router.delete("/:id", categoriasProductoController.deleteCategoriaProducto);

module.exports = router;