const usuariosService = require("../services/usuarios.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await usuariosService.findAll(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const resultado = await usuariosService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll,
    findById
};
