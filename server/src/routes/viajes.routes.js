const express = require("express");
const { createViaje } = require("../controllers/viajes.controller");
const router = express.Router();
router.post("/", createViaje);
module.exports = router;
