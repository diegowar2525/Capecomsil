const { validateImagenUrl, validateDecimal, validateDateTime } = require("./common.validators");
const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del vehículo son obligatorios");
        error.status = 400;
        throw error;
    }

    const {
        placa,
        marca,
        modelo,
        anio,
        capacidad_galones,
        estado
    } = data;

    if (
        typeof placa !== "string" || !placa.trim() ||
        typeof marca !== "string" || !marca.trim() ||
        typeof modelo !== "string" || !modelo.trim()
    ) {
        const error = new Error(
            "Placa, marca y modelo son obligatorios y deben ser texto"
        );
        error.status = 400;
        throw error;
    }

    const anioNumerico = Number(anio);
    const capacidadNumerica = Number(capacidad_galones);

    if (
        !["number", "string"].includes(typeof anio) ||
        !Number.isInteger(anioNumerico) ||
        anioNumerico <= 0
    ) {
        const error = new Error("El año debe ser un número entero válido");
        error.status = 400;
        throw error;
    }

    if (
        !["number", "string"].includes(typeof capacidad_galones) ||
        !Number.isFinite(capacidadNumerica) ||
        capacidadNumerica <= 0
    ) {
        const error = new Error(
            "La capacidad en galones debe ser un número mayor que cero"
        );
        error.status = 400;
        throw error;
    }

    if (estado !== undefined && typeof estado !== "boolean") {
        const error = new Error("El estado debe ser true o false");
        error.status = 400;
        throw error;
    }

    if ((data.kilometraje_base == null) !== (data.fecha_inicio_control_km == null)) {
        const error = new Error("Indique juntos kilometraje_base y fecha_inicio_control_km");
        error.status = 400;
        throw error;
    }
    return {
        kilometraje_base: data.kilometraje_base == null ? null : validateDecimal(data.kilometraje_base, "kilometraje_base", 10, 2),
        fecha_inicio_control_km: data.fecha_inicio_control_km == null ? null : validateDateTime(data.fecha_inicio_control_km),
        imagen_url: validateImagenUrl(data.imagen_url),
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anioNumerico,
        capacidad_galones: capacidadNumerica,
        estado: estado ?? true
    };
};

module.exports = { validateData };