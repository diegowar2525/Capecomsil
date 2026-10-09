const express = require("express");
const { getCuentasPorPagar } = require("../controllers/pagos_proveedor.controller");
const router = express.Router();
router.get("/:id/cuentas-por-pagar", getCuentasPorPagar);

const proveedoresController = require("../controllers/proveedores.controller");

router.get("/", proveedoresController.getProveedores);
router.get("/:id", proveedoresController.getProveedorById);
router.post("/", proveedoresController.createProveedor);
router.put("/:id", proveedoresController.updateProveedor);
router.delete("/:id", proveedoresController.deleteProveedor);

module.exports = router;
