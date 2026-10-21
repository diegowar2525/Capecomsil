const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { revertirAjuste } = require("../controllers/anulaciones.controller");
const {
    getStock, getStockByProducto, getBajoStock, getMovimientos, createAjuste
} = require("../controllers/inventario.controller");

const router = express.Router();
router.post("/ajustes/:id/revertir", exigirPermiso("inventario.revertir"), revertirAjuste);
router.get("/stock", exigirPermiso("inventario.consultar"), getStock);
router.get("/stock/:id", exigirPermiso("inventario.consultar"), getStockByProducto);
router.get("/bajo-stock", exigirPermiso("inventario.consultar"), getBajoStock);
router.get("/movimientos", exigirPermiso("inventario.consultar"), getMovimientos);
router.post("/ajustes", exigirPermiso("inventario.ajustar"), createAjuste);

module.exports = router;
