const { validateId, validateDate, validateDecimal } = require("./common.validators");

const validateOptionalText = (value, campo) => {
    if (value != null && typeof value !== "string") {
        const error = new Error(`El campo ${campo} debe ser texto`);
        error.status = 400;
        throw error;
    }
    return value?.trim() || null;
};

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del mantenimiento son obligatorios");
        error.status = 400;
        throw error;
    }

    const id_vehiculo = validateId(data.id_vehiculo);
    const id_proveedor = data.id_proveedor == null ? null : validateId(data.id_proveedor);
    const fecha = validateDate(data.fecha);

    if (typeof data.tipo !== "string" || !data.tipo.trim() || data.tipo.trim().length > 100) {
        const error = new Error("El tipo de mantenimiento es obligatorio y admite máximo 100 caracteres");
        error.status = 400;
        throw error;
    }

    if (data.detalles !== undefined && !Array.isArray(data.detalles)) {
        const error = new Error("Los detalles deben ser una lista");
        error.status = 400;
        throw error;
    }

    const productos = new Set();
    const detalles = (data.detalles ?? []).map((detalle) => {
        if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) {
            const error = new Error("Cada detalle debe ser un objeto válido");
            error.status = 400;
            throw error;
        }
        const id_producto = validateId(detalle.id_producto);
        const cantidad = validateDecimal(detalle.cantidad, "cantidad", 10, 2);
        if (/^0+(\.0+)?$/.test(cantidad) || productos.has(id_producto)) {
            const error = new Error("Las cantidades deben ser positivas y los productos no pueden repetirse");
            error.status = 400;
            throw error;
        }
        productos.add(id_producto);
        return {
            id_producto,
            cantidad,
            observacion: validateOptionalText(detalle.observacion, "observacion del detalle")
        };
    });

    return {
        id_vehiculo,
        id_proveedor,
        fecha,
        tipo: data.tipo.trim(),
        monto: validateDecimal(data.monto, "monto", 12, 2),
        descripcion: validateOptionalText(data.descripcion, "descripcion"),
        observacion: validateOptionalText(data.observacion, "observacion"),
        detalles
    };
};

module.exports = {
    validateData
};
