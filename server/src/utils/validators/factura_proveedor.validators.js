const { validateId, validateDecimal, validateDate } = require("./common.validators");


const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos de la factura son obligatorios");
        error.status = 400;
        throw error;
    }
    const id_proveedor = validateId(data.id_proveedor);
    if (typeof data.numero_factura !== "string" || !data.numero_factura.trim() || data.numero_factura.trim().length > 50) {
        const error = new Error("El número de factura es obligatorio y admite máximo 50 caracteres");
        error.status = 400;
        throw error;
    }
    const fecha_emision = validateDate(data.fecha_emision);
    const fecha_vencimiento = data.fecha_vencimiento == null ? null : validateDate(data.fecha_vencimiento);
    if (fecha_vencimiento && fecha_vencimiento < fecha_emision) {
        const error = new Error("El vencimiento no puede ser anterior a la emisión");
        error.status = 400;
        throw error;
    }
    if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
        const error = new Error("La factura requiere al menos un detalle");
        error.status = 400;
        throw error;
    }
    const detalles = data.detalles.map((detalle) => {
        if (!detalle || !["PRODUCTO", "SERVICIO"].includes(detalle.tipo_concepto)
            || typeof detalle.descripcion !== "string" || !detalle.descripcion.trim()) {
            const error = new Error("Cada detalle requiere tipo_concepto PRODUCTO o SERVICIO y descripción");
            error.status = 400;
            throw error;
        }
        if (detalle.tipo_concepto === "SERVICIO" && detalle.id_producto != null) {
            const error = new Error("Los servicios no deben tener id_producto");
            error.status = 400;
            throw error;
        }
        const cantidad = validateDecimal(detalle.cantidad, "cantidad", 10, 2);
        const porcentaje_impuesto = validateDecimal(detalle.porcentaje_impuesto, "porcentaje_impuesto", 3, 4);
        if (/^0+(\.0+)?$/.test(cantidad) || Number(porcentaje_impuesto) > 100) {
            const error = new Error("La cantidad debe ser positiva y el porcentaje estar entre 0 y 100");
            error.status = 400;
            throw error;
        }
        return {
            tipo_concepto: detalle.tipo_concepto,
            id_producto: detalle.tipo_concepto === "PRODUCTO" ? validateId(detalle.id_producto) : null,
            descripcion: detalle.descripcion.trim(),
            cantidad,
            precio_unitario: validateDecimal(detalle.precio_unitario, "precio_unitario", 10, 2),
            descuento: validateDecimal(detalle.descuento ?? 0, "descuento", 12, 2),
            porcentaje_impuesto
        };
    });
    let recepcion_inicial = null;
    if (data.recepcion_inicial !== undefined) {
        const recepcion = data.recepcion_inicial;
        if (!recepcion || !Array.isArray(recepcion.detalles) || !recepcion.detalles.length) {
            const error = new Error("La recepción inicial requiere detalles");
            error.status = 400;
            throw error;
        }
        const indices = new Set();
        recepcion_inicial = {
            fecha_recepcion: validateDate(recepcion.fecha_recepcion),
            detalles: recepcion.detalles.map((item) => {
                const numero_detalle = validateId(item?.numero_detalle);
                if (!detalles[numero_detalle - 1] || indices.has(numero_detalle)
                    || detalles[numero_detalle - 1].tipo_concepto !== "PRODUCTO") {
                    const error = new Error("La recepción debe referenciar líneas de producto sin repetirlas");
                    error.status = 400;
                    throw error;
                }
                indices.add(numero_detalle);
                const cantidad_recibida = validateDecimal(item.cantidad_recibida, "cantidad_recibida", 10, 2);
                if (/^0+(\.0+)?$/.test(cantidad_recibida)) {
                    const error = new Error("La cantidad recibida debe ser positiva");
                    error.status = 400;
                    throw error;
                }
                return { numero_detalle, cantidad_recibida };
            })
        };
    }
    return { id_proveedor, numero_factura: data.numero_factura.trim(), fecha_emision, fecha_vencimiento, detalles, recepcion_inicial };
};

module.exports = { validateData };
