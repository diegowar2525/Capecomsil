const permisosService = require("../services/permisos.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await permisosService.findAll();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await permisosService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll,
    findById
};
