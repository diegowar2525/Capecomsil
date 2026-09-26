const express = require("express");
const router = express.Router();

const productosTransportadosController = require(
    "../controllers/productos_transportados.controller"
);

router.get(
    "/",
    productosTransportadosController.getProductosTransportados
);

router.get(
    "/:id",
    productosTransportadosController.getProductoTransportadoById
);

router.post(
    "/",
    productosTransportadosController.createProductoTransportado
);

router.put(
    "/:id",
    productosTransportadosController.updateProductoTransportado
);

router.delete(
    "/:id",
    productosTransportadosController.deleteProductoTransportado
);

module.exports = router;