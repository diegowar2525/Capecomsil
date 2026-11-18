const { createHttpError } = require("../errors/http.error");
const { validateOptionalText } = require("./common.validators");
const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Datos inválidos", 400);
    const nombre = validateOptionalText(data.nombre, "nombre", 150);
    const ruc = validateOptionalText(data.ruc, "ruc", 13);
    if (!nombre) throw createHttpError("La razón social es obligatoria", 400);
    if (!ruc || !/^\d{13}$/.test(ruc)) throw createHttpError("El RUC debe contener 13 dígitos", 400);
    if (data.estado !== undefined && typeof data.estado !== "boolean") throw createHttpError("El estado debe ser booleano", 400);
    return { nombre, ruc, estado: data.estado ?? true };
};
module.exports = { validateData };
