const express = require("express");

const vehiculosRoutes = require("./vehiculos.routes");
const choferesRoutes = require("./choferes.routes");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        message: "La API funciona correctamente"
    });
});

router.use("/vehiculos", vehiculosRoutes);
router.use("/choferes", choferesRoutes);

module.exports = router;