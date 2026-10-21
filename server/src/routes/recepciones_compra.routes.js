const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { anularRecepcion } = require("../controllers/anulaciones.controller");
const { createRecepcionCompra } = require("../controllers/recepciones_compra.controller");

const router = express.Router();
router.post("/:id/anular", exigirPermiso("recepciones.anular"), anularRecepcion);
router.post("/", exigirPermiso("recepciones.crear"), createRecepcionCompra);

module.exports = router;
