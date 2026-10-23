const modalidadesTarifaService = require("../services/modalidades_tarifa.service");

const findAll = async (req, res, next) => {
    try {
        const resultado = await modalidadesTarifaService.findAll(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const resultado = await modalidadesTarifaService.create(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = { findAll, create };
