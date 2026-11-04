const model = require('../models/modelo.model');
const { validateId } = require('../utils/validators/common.validators');
const { validateData, validateAmbito } = require('../utils/validators/modelo.validators');
const { createHttpError } = require('../utils/errors/http.error');
const getModelos = async (query={}) => model.findAll(query.ambito === undefined ? null : validateAmbito(query.ambito));
const getModeloById = async id => {
    const row = await model.findById(validateId(id));
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
const createModelo = async data => {
    const valid = validateData(data);
    const marca = await require("../models/marca.model").findById(valid.id_marca); if (!marca || !marca.estado) throw createHttpError("Seleccione una marca activa",409);
    return model.create(valid);
};
const updateModelo = async (id,data) => {
    const valid = validateData(data);
    const current = await getModeloById(id);
    if (current.id_marca !== valid.id_marca) throw createHttpError('No se puede cambiar la marca de un registro existente',409);
    const row = await model.update(validateId(id),valid);
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
const deleteModelo = async id => {
    const row = await model.remove(validateId(id));
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
module.exports = {getModelos,getModeloById,createModelo,updateModelo,deleteModelo};
