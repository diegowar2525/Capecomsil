const express = require("express");
const router = express.Router();

const gasolinerasController = require("../controllers/gasolineras.controller");

router.get("/", gasolinerasController.getGasolineras);
router.get("/:id", gasolinerasController.getGasolineraById);
router.post("/", gasolinerasController.createGasolinera);
router.put("/:id", gasolinerasController.updateGasolinera);
router.delete("/:id", gasolinerasController.deleteGasolinera);

module.exports = router;