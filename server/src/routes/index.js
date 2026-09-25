const express = require("express");

const vehiculosRoutes = require("./vehiculos.routes");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        message: "La API funciona correctamente"
    });
});

router.use("/vehiculos", vehiculosRoutes);

module.exports = router;