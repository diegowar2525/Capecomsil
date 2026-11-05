const resumenService = require('../services/resumen.service');

const getMensual = async (req, res, next) => {
    try {
        const resultado = await resumenService.getMensual(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};
const getCuentasPorCobrar = async (req, res, next) => {
    try {
        const resultado = await resumenService.getCuentasPorCobrar(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};
module.exports = { getMensual, getCuentasPorCobrar };
