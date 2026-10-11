const { createHttpError } = require("../errors/http.error");
const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");

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
        const origen_producto = detalle.origen_producto === undefined ? "INVENTARIO" : detalle.origen_producto;
        if (!["INVENTARIO", "EXTERNO"].includes(origen_producto)) throw createHttpError("Origen de producto inválido", 400);
        if (origen_producto === "EXTERNO" && detalle.id_producto != null) throw createHttpError("Un material externo no debe indicar id_producto", 400);
        const id_producto = origen_producto === "INVENTARIO" ? validateId(detalle.id_producto) : null;
        const descripcion_producto = validateOptionalText(detalle.descripcion_producto, "descripcion_producto", 200);
        if (origen_producto === "EXTERNO" && !descripcion_producto) throw createHttpError("Describa el material externo", 400);
        const cantidad = validateDecimal(detalle.cantidad, "cantidad", 10, 2);
        if (/^0+(\.0+)?$/.test(cantidad) || (id_producto !== null && productos.has(id_producto))) {
            const error = new Error("Las cantidades deben ser positivas y los productos no pueden repetirse");
            error.status = 400;
            throw error;
        }
        if (id_producto !== null) productos.add(id_producto);
        return {
            id_producto,
            origen_producto,
            descripcion_producto,
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
