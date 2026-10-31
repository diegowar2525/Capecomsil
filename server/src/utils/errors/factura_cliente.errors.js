const translateFacturaClienteError = (error) => {
    const mensajes = {
        factura_cliente_historial: "Las facturas solo admiten anulación con motivo",
        factura_cliente_liquidacion: "La factura debe corresponder a una liquidación confirmada y conservar sus importes",
        factura_cliente_cobros: "Anule primero los cobros vigentes de la factura",
        cobro_cliente_historial: "Los cobros solo admiten anulación con motivo",
        cobro_cliente_saldo: "Revise el saldo, la fecha y el estado de la factura",
        factura_liquidacion_vigente: "La liquidación ya tiene una factura vigente",
        factura_numero_factura_key: "El número de factura ya está registrado"
    };
    if (mensajes[error.constraint]) return { status: 409, message: mensajes[error.constraint] };
    if (["factura", "pago"].includes(error.table) && ["23503", "23514"].includes(error.code)) {
        return { status: 409, message: "Los datos no cumplen las condiciones de facturación o cobro" };
    }
    return null;
};
module.exports = { translateFacturaClienteError };
