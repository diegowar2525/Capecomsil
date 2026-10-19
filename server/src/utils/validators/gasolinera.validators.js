const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos deben ser un objeto válido", 400);
    }
    const { nombre, ruc, agente_retencion, estado } = data;
    if (typeof nombre !== "string" || nombre.trim() === "") {
        throw createHttpError("El nombre de la gasolinera es obligatorio", 400);
    }
    if (typeof ruc !== "string" || ruc.trim() === "") {
        throw createHttpError("El RUC de la gasolinera es obligatorio", 400);
    }
    if (agente_retencion !== undefined && typeof agente_retencion !== "boolean") {
        throw createHttpError("El campo agente_retencion debe ser booleano", 400);
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
    if (
        data.representante_legal !== undefined &&
        data.representante_legal !== null &&
        typeof data.representante_legal !== "string"
    ) {
        throw createHttpError("El campo representante_legal debe ser texto", 400);
    }
    return {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        correo: data.correo?.trim() || null,
        representante_legal: data.representante_legal?.trim() || null,
        agente_retencion: agente_retencion ?? false,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
