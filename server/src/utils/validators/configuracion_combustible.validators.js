const { validateId, validateDate, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateConfiguracion = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Datos obligatorios", 400);
    const fecha_inicio = validateDate(data.fecha_inicio);
    const fecha_fin = data.fecha_fin == null ? null : validateDate(data.fecha_fin);
    if (fecha_fin && fecha_fin < fecha_inicio) throw createHttpError("Vigencia inválida", 400);
    const consumo_galones_km = validateDecimal(data.consumo_galones_km, "consumo_galones_km", 6, 6);
    if (/^0+(\.0+)?$/.test(consumo_galones_km)) throw createHttpError("consumo_galones_km debe ser mayor que cero", 400);
    const precio_por_galon = validateDecimal(data.precio_por_galon, "precio_por_galon", 8, 4);
    if (/^0+(\.0+)?$/.test(precio_por_galon)) throw createHttpError("precio_por_galon debe ser mayor que cero", 400);
    return { consumo_galones_km, precio_por_galon, fecha_inicio, fecha_fin, observacion: validateOptionalText(data.observacion, "observacion") };
};
module.exports = { validateConfiguracion };
