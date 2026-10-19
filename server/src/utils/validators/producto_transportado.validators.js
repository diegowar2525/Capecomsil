const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos deben ser un objeto válido", 400);
    }
    const { nombre, unidad_medida, estado } = data;
    if (typeof nombre !== "string" || nombre.trim() === "") {
        throw createHttpError("El nombre del producto transportado es obligatorio", 400);
    }
    if (typeof unidad_medida !== "string" || unidad_medida.trim() === "") {
        throw createHttpError("La unidad de medida es obligatoria", 400);
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
    return {
        nombre: data.nombre.trim(),
        unidad_medida: data.unidad_medida.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
