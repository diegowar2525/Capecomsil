const { createHttpError } = require("../errors/http.error");
const { validateId, validateDecimal, validateDate } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos de la factura son obligatorios", 400);
    }
    const id_proveedor = validateId(data.id_proveedor);
    if (
        typeof data.numero_factura !== "string" ||
        !data.numero_factura.trim() ||
        data.numero_factura.trim().length > 50
    ) {
        throw createHttpError(
            "El número de factura es obligatorio y admite máximo 50 caracteres",
            400
        );
    }
    const fecha_emision = validateDate(data.fecha_emision);
    const fecha_vencimiento =
        data.fecha_vencimiento == null ? null : validateDate(data.fecha_vencimiento);
    if (fecha_vencimiento && fecha_vencimiento < fecha_emision) {
        throw createHttpError("El vencimiento no puede ser anterior a la emisión", 400);
    }
    if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
        throw createHttpError("La factura requiere al menos un detalle", 400);
    }
    const detalles = data.detalles.map((detalle) => {
        if (
            !detalle ||
            !["PRODUCTO", "SERVICIO"].includes(detalle.tipo_concepto) ||
            typeof detalle.descripcion !== "string" ||
            !detalle.descripcion.trim()
        ) {
            throw createHttpError(
                "Cada detalle requiere tipo_concepto PRODUCTO o SERVICIO y descripción",
                400
            );
        }
        if (detalle.tipo_concepto === "SERVICIO" && detalle.id_producto != null) {
            throw createHttpError("Los servicios no deben tener id_producto", 400);
        }
        const cantidad = validateDecimal(detalle.cantidad, "cantidad", 10, 2);
        const porcentaje_impuesto = validateDecimal(
            detalle.porcentaje_impuesto,
            "porcentaje_impuesto",
            3,
            4
        );
        if (/^0+(\.0+)?$/.test(cantidad) || Number(porcentaje_impuesto) > 100) {
            throw createHttpError(
                "La cantidad debe ser positiva y el porcentaje estar entre 0 y 100",
                400
            );
        }
        return {
            tipo_concepto: detalle.tipo_concepto,
            id_producto:
                detalle.tipo_concepto === "PRODUCTO" ? validateId(detalle.id_producto) : null,
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
            throw createHttpError("La recepción inicial requiere detalles", 400);
        }
        const indices = new Set();
        recepcion_inicial = {
            fecha_recepcion: validateDate(recepcion.fecha_recepcion),
            detalles: recepcion.detalles.map((item) => {
                const numero_detalle = validateId(item?.numero_detalle);
                if (
                    !detalles[numero_detalle - 1] ||
                    indices.has(numero_detalle) ||
                    detalles[numero_detalle - 1].tipo_concepto !== "PRODUCTO"
                ) {
                    throw createHttpError(
                        "La recepción debe referenciar líneas de producto sin repetirlas",
                        400
                    );
                }
                indices.add(numero_detalle);
                const cantidad_recibida = validateDecimal(
                    item.cantidad_recibida,
                    "cantidad_recibida",
                    10,
                    2
                );
                if (/^0+(\.0+)?$/.test(cantidad_recibida)) {
                    throw createHttpError("La cantidad recibida debe ser positiva", 400);
                }
                return {
                    numero_detalle,
                    cantidad_recibida
                };
            })
        };
    }
    return {
        id_proveedor,
        numero_factura: data.numero_factura.trim(),
        fecha_emision,
        fecha_vencimiento,
        detalles,
        recepcion_inicial
    };
};

module.exports = {
    validateData
};
