const express = require("express");
const { createRecepcionCompra } = require("../controllers/recepciones_compra.controller");

const router = express.Router();
router.post("/", createRecepcionCompra);

module.exports = router;
