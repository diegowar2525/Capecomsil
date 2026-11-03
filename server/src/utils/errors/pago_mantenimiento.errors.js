const messages = {
    mantenimiento_pago_historial: "El importe y las referencias del desembolso no pueden modificarse",
    mantenimiento_pago_datos: "El pago debe corresponder al vehículo y proveedor de un trabajo vigente, con fecha igual o posterior al inicio",
    mantenimiento_pago_via: "Use la vía de pago elegida al registrar el trabajo: directa o mediante factura",
    mantenimiento_pago_factura: "El desembolso debe corresponder a un pago vigente de la factura vinculada",
    mantenimiento_pago_saldo: "El monto debe ser positivo y no superar el saldo pendiente del taller",
    mantenimiento_factura_datos: "La factura debe estar vigente, corresponder al proveedor y al importe del taller, sin pagos anteriores al trabajo",
    mantenimiento_id_factura_proveedor_key: "La factura ya está vinculada a otro mantenimiento o reparación",
    mantenimiento_pagado: "Anule primero los pagos y la factura asociados al trabajo"
};

const translatePagoMantenimientoError = (error) => {
    const message = messages[error.constraint];
    return message ? { status: 409, message } : null;
};

module.exports = { translatePagoMantenimientoError };
