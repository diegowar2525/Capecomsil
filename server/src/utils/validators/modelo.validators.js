const { createHttpError } = require("../errors/http.error");
const { validateId, validateOptionalText } = require("./common.validators");
const validateAmbito = value => {
    if (!['VEHICULO','PRODUCTO'].includes(value)) throw createHttpError("Ámbito inválido",400);
    return value;
};
const validateData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw createHttpError("Datos inválidos",400);
    const nombre = validateOptionalText(data.nombre,'nombre',100)?.replace(/\s+/g,' ');
    if (!nombre) throw createHttpError("El nombre es obligatorio",400);
    if (data.estado !== undefined && typeof data.estado !== 'boolean') throw createHttpError("El estado debe ser booleano",400);
    return { nombre, estado: data.estado ?? true, id_marca: validateId(data.id_marca) };
};
module.exports = {validateData,validateAmbito};
