const model = require('../models/marca.model');
const { validateId } = require('../utils/validators/common.validators');
const { validateData, validateAmbito } = require('../utils/validators/marca.validators');
const { createHttpError } = require('../utils/errors/http.error');
const getMarcas = async (query={}) => model.findAll(query.ambito === undefined ? null : validateAmbito(query.ambito));
const getMarcaById = async id => {
    const row = await model.findById(validateId(id));
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
const createMarca = async data => {
    const valid = validateData(data);
    
    return model.create(valid);
};
const updateMarca = async (id,data) => {
    const valid = validateData(data);
    const current = await getMarcaById(id);
    if (current.ambito !== valid.ambito) throw createHttpError('No se puede cambiar el ámbito de un registro existente',409);
    const row = await model.update(validateId(id),valid);
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
const deleteMarca = async id => {
    const row = await model.remove(validateId(id));
    if (!row) throw createHttpError('Registro no encontrado',404);
    return row;
};
module.exports = {getMarcas,getMarcaById,createMarca,updateMarca,deleteMarca};
