const { createHttpError } = require("../errors/http.error");
const { validateImagenUrl, validateDecimal, validateDateTime } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del vehículo son obligatorios", 400);
    }
    const { placa, marca, modelo, anio, capacidad_galones, estado } = data;
    if (
        typeof placa !== "string" ||
        !placa.trim() ||
        typeof marca !== "string" ||
        !marca.trim() ||
        typeof modelo !== "string" ||
        !modelo.trim()
    ) {
        throw createHttpError("Placa, marca y modelo son obligatorios y deben ser texto", 400);
    }
    const anioNumerico = Number(anio);
    const capacidadNumerica = Number(capacidad_galones);
    if (
        !["number", "string"].includes(typeof anio) ||
        !Number.isInteger(anioNumerico) ||
        anioNumerico <= 0
    ) {
        throw createHttpError("El año debe ser un número entero válido", 400);
    }
    if (
        !["number", "string"].includes(typeof capacidad_galones) ||
        !Number.isFinite(capacidadNumerica) ||
        capacidadNumerica <= 0
    ) {
        throw createHttpError("La capacidad en galones debe ser un número mayor que cero", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El estado debe ser true o false", 400);
    }
    if ((data.kilometraje_base == null) !== (data.fecha_inicio_control_km == null)) {
        throw createHttpError("Indique juntos kilometraje_base y fecha_inicio_control_km", 400);
    }
    return {
        kilometraje_base:
            data.kilometraje_base == null
                ? null
                : validateDecimal(data.kilometraje_base, "kilometraje_base", 10, 2),
        fecha_inicio_control_km:
            data.fecha_inicio_control_km == null
                ? null
                : validateDateTime(data.fecha_inicio_control_km),
        imagen_url: validateImagenUrl(data.imagen_url),
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anioNumerico,
        capacidad_galones: capacidadNumerica,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
