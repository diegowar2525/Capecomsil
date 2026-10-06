const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");


const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos de la recepción son obligatorios");
        error.status = 400;
        throw error;
    }
    const id_factura_proveedor = validateId(data.id_factura_proveedor);
    const fecha_recepcion = validateDate(data.fecha_recepcion);
    if (!Array.isArray(data.detalles) || !data.detalles.length) {
        const error = new Error("La recepción requiere al menos un detalle");
        error.status = 400;
        throw error;
    }

    const registrados = new Set();
    const detalles = data.detalles.map((detalle) => {
        const id_detalle_factura_proveedor = validateId(detalle?.id_detalle_factura_proveedor);
        const cantidad_recibida = validateDecimal(detalle.cantidad_recibida, "cantidad_recibida", 10, 2);
        if (registrados.has(id_detalle_factura_proveedor) || /^0+(\.0+)?$/.test(cantidad_recibida)) {
            const error = new Error("Los detalles no pueden repetirse y las cantidades deben ser positivas");
            error.status = 400;
            throw error;
        }
        registrados.add(id_detalle_factura_proveedor);
        return {
            id_detalle_factura_proveedor,
            cantidad_recibida,
            observacion: validateOptionalText(detalle.observacion, "observacion del detalle")
        };
    });

    return {
        id_factura_proveedor,
        fecha_recepcion,
        numero_comprobante: validateOptionalText(data.numero_comprobante, "numero_comprobante", 100),
        observacion: validateOptionalText(data.observacion, "observacion"),
        detalles
    };
};

module.exports = {
    validateData
};
