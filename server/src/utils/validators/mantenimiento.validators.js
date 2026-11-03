const { createHttpError } = require("../errors/http.error");
const { validatePlanesCumplidos } = require("./plan_mantenimiento.validators");
const {
    validateId,
    validateDateTime,
    validateDecimal,
    validateOptionalText
} = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del mantenimiento son obligatorios", 400);
    }
    if (!["PREVENTIVO", "CORRECTIVO"].includes(data.clase)) {
        throw createHttpError("Seleccione preventivo o correctivo / reparación", 400);
    }
    const id_vehiculo = validateId(data.id_vehiculo);
    const id_proveedor = data.id_proveedor == null ? null : validateId(data.id_proveedor);
    if (data.id_factura_proveedor != null && id_proveedor === null) {
        throw createHttpError("Seleccione el proveedor de la factura del taller", 400);
    }
    if (data.fecha !== undefined) {
        throw createHttpError("Use fecha_inicio y fecha_fin con fecha y hora", 400);
    }
    const fecha_inicio = validateDateTime(data.fecha_inicio);
    const fecha_fin = data.fecha_fin == null ? null : validateDateTime(data.fecha_fin);
    if (data.fecha_inicio.length <= 10 || (fecha_fin && data.fecha_fin.length <= 10)) {
        throw createHttpError("Indique la hora del mantenimiento", 400);
    }
    if (fecha_fin && fecha_fin <= fecha_inicio) {
        throw createHttpError("El fin debe ser posterior al inicio", 400);
    }
    if (typeof data.tipo !== "string" || !data.tipo.trim() || data.tipo.trim().length > 100) {
        throw createHttpError(
            "El tipo de mantenimiento es obligatorio y admite máximo 100 caracteres",
            400
        );
    }
    if (data.detalles !== undefined && (!Array.isArray(data.detalles) || data.detalles.length)) {
        throw createHttpError("Los materiales se registran mediante movimientos manuales de inventario o en la factura", 400);
    }
    const detalles = [];
    const planes_cumplidos = validatePlanesCumplidos(data.planes_cumplidos);
    if (planes_cumplidos.length && data.clase !== "PREVENTIVO") {
        throw createHttpError("Solo los trabajos preventivos pueden cumplir planes de mantenimiento", 400);
    }
    if (planes_cumplidos.length && !fecha_fin) {
        throw createHttpError("Indique los planes cumplidos al finalizar el mantenimiento", 400);
    }
    return {
        clase: data.clase,
        numero_comprobante: validateOptionalText(data.numero_comprobante, "numero_comprobante", 100),
        id_factura_proveedor: data.id_factura_proveedor == null ? null : validateId(data.id_factura_proveedor),
        planes_cumplidos,
        id_vehiculo,
        id_proveedor,
        fecha_inicio,
        fecha_fin,
        tipo: data.tipo.trim(),
        monto: validateDecimal(data.monto, "monto", 12, 2),
        descripcion: validateOptionalText(data.descripcion, "descripcion"),
        observacion: validateOptionalText(data.observacion, "observacion"),
        detalles
    };
};

const validateFinalizacion = (data) => {
    if (!data || typeof data.fecha_fin !== "string" || data.fecha_fin.length <= 10) {
        throw createHttpError("Indique fecha_fin con fecha y hora", 400);
    }
    return validateDateTime(data.fecha_fin);
};

module.exports = {
    validateFinalizacion,
    validateData
};
