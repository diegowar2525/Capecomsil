const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos deben ser un objeto válido", 400);
    }
    const { nombre, estado } = data;
    if (typeof nombre !== "string" || nombre.trim() === "") {
        throw createHttpError("El nombre de la categoría es obligatorio", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El campo estado debe ser booleano", 400);
    }
    if (
        data.descripcion !== undefined &&
        data.descripcion !== null &&
        typeof data.descripcion !== "string"
    ) {
        throw createHttpError("El campo descripcion debe ser texto", 400);
    }
    if (data.es_llanta !== undefined && typeof data.es_llanta !== "boolean") {
        throw createHttpError("es_llanta debe ser true o false", 400);
    }
    return {
        es_llanta: data.es_llanta ?? false,
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
