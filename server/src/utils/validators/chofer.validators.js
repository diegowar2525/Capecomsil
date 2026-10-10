const { validateImagenUrl } = require("./common.validators");
const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del chofer son obligatorios");
        error.status = 400;
        throw error;
    }

    const {
        nombre,
        cedula,
        telefono,
        tipo_remuneracion,
        estado,
    } = data;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof cedula !== "string" ||
        !cedula.trim() ||
        typeof tipo_remuneracion !== "string" ||
        !tipo_remuneracion.trim()
    ) {
        const error = new Error(
            "Nombre, cédula y tipo de remuneración son obligatorios."
        );
        error.status = 400;
        throw error;
    }

    const tipoRemuneracionValidado = tipo_remuneracion.trim().toUpperCase();

    if (!["SUELDO", "POR_VIAJE"].includes(tipoRemuneracionValidado)) {
        const error = new Error("El tipo de remuneración debe ser SUELDO o POR_VIAJE.");
        error.status = 400;
        throw error;
    }

    if (
        telefono !== undefined &&
        telefono !== null &&
        typeof telefono !== "string"
    ) {
        const error = new Error("El teléfono debe ser texto.");
        error.status = 400;
        throw error;
    }

    if (estado !== undefined && typeof estado !== "boolean") {
        const error = new Error("El estado debe ser true o false.");
        error.status = 400;
        throw error;
    }

    return {
        imagen_url: validateImagenUrl(data.imagen_url),
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono?.trim() || null,
        tipo_remuneracion: tipoRemuneracionValidado,
        estado: estado ?? true,
    };
};

module.exports = { validateData };
