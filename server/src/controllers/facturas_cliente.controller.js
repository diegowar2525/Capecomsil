const facturasClienteService = require("../services/facturas_cliente.service");

const getAll = async (req, res, next) => {
    try {
        const resultado = await facturasClienteService.findAll(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const resultado = await facturasClienteService.findById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const resultado = await facturasClienteService.create(req.body, req.auth.usuario.id_usuario);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anular = async (req, res, next) => {
    try {
        const resultado = await facturasClienteService.anular(req.params.id, req.body, req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getById, create, anular };
