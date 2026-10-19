const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del terminal son obligatorios", 400);
    }
    const { nombre, ubicacion, estado } = data;
    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof ubicacion !== "string" ||
        !ubicacion.trim()
    ) {
        throw createHttpError("El nombre y la ubicación son obligatorios", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El estado debe ser true o false", 400);
    }
    return {
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
