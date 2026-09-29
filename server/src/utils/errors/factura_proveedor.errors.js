const translateFacturaProveedorError = (error) => {
    if (error.code === "23505" && error.constraint === "uq_factura_proveedor_numero") {
        return { status: 409, message: "Ya existe una factura con ese número para el proveedor" };
    }
    if (error.code === "23514" && ["chk_factura_proveedor_monto", "chk_detalle_factura_proveedor_valores", "chk_detalle_factura_concepto", "chk_detalle_factura_descripcion"].includes(error.constraint)) {
        return { status: 400, message: "Los conceptos o importes de la factura no son válidos; revise descuentos, cantidades e impuestos" };
    }
    return null;
};

module.exports = { translateFacturaProveedorError };
