const { validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Datos de tipo de gasto obligatorios", 400);
    }
    const codigo = validateOptionalText(data.codigo, "codigo", 100)?.toUpperCase();
    const nombre = validateOptionalText(data.nombre, "nombre", 100);
    if (!codigo || !nombre) {
        throw createHttpError("Código y nombre son obligatorios", 400);
    }
    if (data.estado !== undefined && typeof data.estado !== "boolean") {
        throw createHttpError("estado debe ser booleano", 400);
    }
    return {
        codigo,
        nombre,
        descripcion: validateOptionalText(data.descripcion, "descripcion"),
        estado: data.estado ?? true
    };
};

module.exports = { validateData };
