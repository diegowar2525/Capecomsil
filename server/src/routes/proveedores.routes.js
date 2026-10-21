const { exigirPermiso } = require("../middlewares/auth.middleware");
const express = require("express");
const { getCuentasPorPagar } = require("../controllers/pagos_proveedor.controller");
const router = express.Router();
router.get("/:id/cuentas-por-pagar", exigirPermiso("pagos_proveedor.consultar"), getCuentasPorPagar);

const proveedoresController = require("../controllers/proveedores.controller");

router.get("/", exigirPermiso("catalogos.consultar"), proveedoresController.getProveedores);
router.get("/:id", exigirPermiso("catalogos.consultar"), proveedoresController.getProveedorById);
router.post("/", exigirPermiso("catalogos.crear"), proveedoresController.createProveedor);
router.put("/:id", exigirPermiso("catalogos.editar"), proveedoresController.updateProveedor);
router.delete("/:id", exigirPermiso("catalogos.eliminar"), proveedoresController.deleteProveedor);

module.exports = router;
