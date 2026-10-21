const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");

const {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
} = require("../controllers/productos.controller");

const router = express.Router();

router.get("/", exigirPermiso("catalogos.consultar"), getProductos);
router.get("/:id", exigirPermiso("catalogos.consultar"), getProductoById);
router.post("/", exigirPermiso("catalogos.crear"), createProducto);
router.put("/:id", exigirPermiso("catalogos.editar"), updateProducto);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), deleteProducto);

module.exports = router;