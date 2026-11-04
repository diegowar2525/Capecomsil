const { createHttpError } = require("../errors/http.error");
const { validateOptionalText, validateId } = require("./common.validators");
const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Datos inválidos", 400);
    const nombre = validateOptionalText(data.nombre, "nombre", 100);
    if (!nombre) throw createHttpError("El nombre es obligatorio", 400);
    if (data.estado !== undefined && typeof data.estado !== "boolean") throw createHttpError("El estado debe ser booleano", 400);
    return { nombre, estado: data.estado ?? true, id_provincia: validateId(data.id_provincia) };
};
module.exports = { validateData };
