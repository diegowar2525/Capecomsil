const {
    validateId,
    validateDateTime,
    validateDecimal,
    validateOptionalText
} = require("./common.validators");
const { createHttpError } = require("../errors/http.error");
const { validateFiltros } = require("./gasto.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del abastecimiento son obligatorios", 400);
    }
    if (typeof data.tanque_lleno !== "boolean") {
        throw createHttpError("tanque_lleno debe ser true o false", 400);
    }
    if (data.monto !== undefined || data.id_gasto !== undefined) {
        throw createHttpError("El gasto y su monto se generan automáticamente", 400);
    }
    const galones = validateDecimal(data.galones, "galones", 8, 4);
    const precio_por_galon = validateDecimal(data.precio_por_galon, "precio_por_galon", 8, 4);
    if ([galones, precio_por_galon].some((v) => /^0+(\.0+)?$/.test(v))) {
        throw createHttpError("Galones y precio deben ser mayores que cero", 400);
    }
    return {
        id_vehiculo: validateId(data.id_vehiculo),
        id_proveedor: data.id_proveedor == null ? null : validateId(data.id_proveedor),
        fecha_hora: validateDateTime(data.fecha_hora),
        kilometraje_odometro: validateDecimal(
            data.kilometraje_odometro,
            "kilometraje_odometro",
            10,
            2
        ),
        galones,
        precio_por_galon,
        tanque_lleno: data.tanque_lleno,
        numero_comprobante: validateOptionalText(
            data.numero_comprobante,
            "numero_comprobante",
            100
        ),
        observacion: validateOptionalText(data.observacion, "observacion")
    };
};

module.exports = {
    validateData,
    validateFiltros
};
