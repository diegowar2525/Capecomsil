const { createHttpError } = require("../errors/http.error");
const { validateId, validateImagenUrl, validateDecimal, validateDateTime } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del vehículo son obligatorios", 400);
    }
    const { placa, anio, capacidad_galones, estado } = data;
    if (typeof placa !== "string" || !placa.trim()) throw createHttpError("La placa es obligatoria",400);
    if (data.marca !== undefined || data.modelo !== undefined) throw createHttpError("Seleccione id_marca e id_modelo del catálogo",400);
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
        id_marca: validateId(data.id_marca),
        id_modelo: validateId(data.id_modelo),
        anio: anioNumerico,
        capacidad_galones: capacidadNumerica,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
