const express = require("express");
const { anularRecepcion } = require("../controllers/anulaciones.controller");
const { createRecepcionCompra } = require("../controllers/recepciones_compra.controller");

const router = express.Router();
router.post("/:id/anular", anularRecepcion);
router.post("/", createRecepcionCompra);

module.exports = router;
