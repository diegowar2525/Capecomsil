const express = require("express");
const { autenticar, protegerOperacion } = require("../middlewares/auth.middleware");
const trayectosRoutes = require("./trayectos.routes");
const viajesRoutes = require("./viajes.routes");
const pagosProveedorRoutes = require("./pagos_proveedor.routes");
const inventarioRoutes = require("./inventario.routes");
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

router.use("/auth", require("./auth.routes"));

router.get("/health", (req, res) => {
    res.json({
        message: "La API funciona correctamente"
    });
});

router.use(autenticar, protegerOperacion);

router.use("/usuarios", require("./usuarios.routes"));
router.use("/roles", require("./roles.routes"));
router.use("/permisos", require("./permisos.routes"));
router.use("/vehiculos", vehiculosRoutes);
router.use("/viajes", viajesRoutes);
router.use("/trayectos", trayectosRoutes);
router.use("/choferes", choferesRoutes);
router.use("/terminales", terminalesRoutes);
router.use("/gasolineras", gasolinerasRoutes);
router.use("/proveedores", proveedoresRoutes);
router.use("/pagos-proveedor", pagosProveedorRoutes);
router.use("/tarifas", tarifasRoutes);
router.use("/productos", productosRoutes);
router.use("/categorias-producto", categoriasProductoRoutes);
router.use("/facturas-proveedor", facturasProveedorRoutes);
router.use("/recepciones-compra", recepcionesCompraRoutes);
router.use("/mantenimientos", mantenimientosRoutes);
router.use("/inventario", inventarioRoutes);
router.use(
    "/productos-transportados",
    productosTransportadosRoutes
);

router.use("/configuraciones-remuneracion", require("./configuracion_remuneracion.routes"));
router.use("/feriados", require("./feriado.routes"));
router.use("/remuneraciones-chofer", require("./remuneraciones.routes"));
router.use("/configuraciones-combustible", require("./configuracion_combustible.routes"));
router.use("/configuraciones-viatico", require("./configuracion_viatico.routes"));
router.use("/configuraciones-peaje-trayecto", require("./configuracion_peaje_trayecto.routes"));
router.use("/planes-mantenimiento", require("./planes_mantenimiento.routes"));
router.use("/gastos", require("./gastos.routes"));
router.use("/abastecimientos-combustible", require("./abastecimientos_combustible.routes"));
router.use("/informes", require("./informes.routes"));
router.use("/liquidaciones", require("./liquidaciones.routes"));
module.exports = router;
