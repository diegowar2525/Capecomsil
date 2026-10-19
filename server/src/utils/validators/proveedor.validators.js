const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos deben ser un objeto válido", 400);
    }
    const { nombre, ruc, estado } = data;
    if (typeof nombre !== "string" || nombre.trim() === "") {
        throw createHttpError("El nombre del proveedor es obligatorio", 400);
    }
    if (typeof ruc !== "string" || ruc.trim() === "") {
        throw createHttpError("El RUC del proveedor es obligatorio", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El campo estado debe ser booleano", 400);
    }
    if (
        data.direccion !== undefined &&
        data.direccion !== null &&
        typeof data.direccion !== "string"
    ) {
        throw createHttpError("El campo direccion debe ser texto", 400);
    }
    if (
        data.telefono !== undefined &&
        data.telefono !== null &&
        typeof data.telefono !== "string"
    ) {
        throw createHttpError("El campo telefono debe ser texto", 400);
    }
    if (data.correo !== undefined && data.correo !== null && typeof data.correo !== "string") {
        throw createHttpError("El campo correo debe ser texto", 400);
    }
    return {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        correo: data.correo?.trim() || null,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
