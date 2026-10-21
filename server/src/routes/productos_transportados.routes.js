const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const router = express.Router();

const productosTransportadosController = require(
    "../controllers/productos_transportados.controller"
);

router.get("/", exigirPermiso("catalogos.consultar"), productosTransportadosController.getProductosTransportados
);

router.get("/:id", exigirPermiso("catalogos.consultar"), productosTransportadosController.getProductoTransportadoById
);

router.post("/", exigirPermiso("catalogos.crear"), productosTransportadosController.createProductoTransportado
);

router.put("/:id", exigirPermiso("catalogos.editar"), productosTransportadosController.updateProductoTransportado
);

router.delete("/:id", exigirPermiso("catalogos.eliminar"), productosTransportadosController.deleteProductoTransportado
);

module.exports = router;