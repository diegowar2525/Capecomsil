const rolModel = require("../models/rol.model");
const rolPermisoModel = require("../models/rol_permiso.model");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const findAll = async () => {
    return rolModel.findAll();
};

const findById = async (id) => {
    const resultado = await rolModel.findById(validateId(id));
    if (!resultado) {
        throw createHttpError("Rol no encontrado", 404);
    }
    return resultado;
};

const findPermisos = async (id) => {
    const rol = await findById(id);
    return rolPermisoModel.findByRol(rol.id_rol);
};

module.exports = {
    findAll,
    findById,
    findPermisos
};
