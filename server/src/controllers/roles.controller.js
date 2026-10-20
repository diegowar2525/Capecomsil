const rolesService = require("../services/roles.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await rolesService.findAll();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await rolesService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findPermisos = async (req, res, next) => {
    try {
        const resultado = await rolesService.findPermisos(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll,
    findById,
    findPermisos
};
