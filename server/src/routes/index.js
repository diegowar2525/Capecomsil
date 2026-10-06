const express = require("express");
const recepcionesCompraRoutes = require("./recepciones_compra.routes");
const facturasProveedorRoutes = require("./facturas_proveedor.routes");
const mantenimientosRoutes = require("./mantenimientos.routes");

const vehiculosRoutes = require("./vehiculos.routes");
const choferesRoutes = require("./choferes.routes");
const terminalesRoutes = require("./terminales.routes");
const gasolinerasRoutes = require("./gasolineras.routes");
const proveedoresRoutes = require("./proveedores.routes");
const tarifasRoutes = require("./tarifas.routes");
const productosRoutes = require("./productos.routes");
const categoriasProductoRoutes = require("./categorias_producto.routes");
const productosTransportadosRoutes = require(
    "./productos_transportados.routes"
);

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({
        message: "La API funciona correctamente"
    });
});

router.use("/vehiculos", vehiculosRoutes);
router.use("/choferes", choferesRoutes);
router.use("/terminales", terminalesRoutes);
router.use("/gasolineras", gasolinerasRoutes);
router.use("/proveedores", proveedoresRoutes);
router.use("/tarifas", tarifasRoutes);
router.use("/productos", productosRoutes);
router.use("/categorias-producto", categoriasProductoRoutes);
router.use("/facturas-proveedor", facturasProveedorRoutes);
router.use("/recepciones-compra", recepcionesCompraRoutes);
router.use("/mantenimientos", mantenimientosRoutes);
router.use(
    "/productos-transportados",
    productosTransportadosRoutes
);

module.exports = router;
