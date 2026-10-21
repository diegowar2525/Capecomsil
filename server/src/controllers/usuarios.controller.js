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

const create = async (req, res, next) => {
    try {
        const resultado = await usuariosService.create(req.body, req.auth.usuario.id_usuario);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const resultado = await usuariosService.update(req.params.id, req.body, req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateEstado = async (req, res, next) => {
    try {
        const resultado = await usuariosService.updateEstado(req.params.id, req.body, req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const resultado = await usuariosService.resetPassword(req.params.id, req.body, req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const findHistorial = async (req, res, next) => {
    try {
        const resultado = await usuariosService.findHistorial(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    update,
    updateEstado,
    resetPassword,
    findHistorial,
    findAll,
    findById
};
