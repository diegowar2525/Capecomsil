const express = require("express");
const { revertirAjuste } = require("../controllers/anulaciones.controller");
const {
    getStock, getStockByProducto, getBajoStock, getMovimientos, createAjuste
} = require("../controllers/inventario.controller");

const router = express.Router();
router.post("/ajustes/:id/revertir", revertirAjuste);
router.get("/stock", getStock);
router.get("/stock/:id", getStockByProducto);
router.get("/bajo-stock", getBajoStock);
router.get("/movimientos", getMovimientos);
router.post("/ajustes", createAjuste);

module.exports = router;
