const { createHttpError } = require("../errors/http.error");
const { validateImagenUrl } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del chofer son obligatorios", 400);
    }
    const { nombre, cedula, telefono, tipo_remuneracion, estado } = data;
    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof cedula !== "string" ||
        !cedula.trim() ||
        typeof tipo_remuneracion !== "string" ||
        !tipo_remuneracion.trim()
    ) {
        throw createHttpError("Nombre, cédula y tipo de remuneración son obligatorios.", 400);
    }
    const tipoRemuneracionValidado = tipo_remuneracion.trim().toUpperCase();
    if (!["DIARIO_FIJO", "DIA_TRABAJADO"].includes(tipoRemuneracionValidado)) {
        throw createHttpError("El tipo de remuneración debe ser DIARIO_FIJO o DIA_TRABAJADO.", 400);
    }
    if (telefono !== undefined && telefono !== null && typeof telefono !== "string") {
        throw createHttpError("El teléfono debe ser texto.", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El estado debe ser true o false.", 400);
    }
    return {
        imagen_url: validateImagenUrl(data.imagen_url),
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono?.trim() || null,
        tipo_remuneracion: tipoRemuneracionValidado,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
