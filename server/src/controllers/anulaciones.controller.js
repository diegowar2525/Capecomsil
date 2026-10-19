const anulacionesService = require("../services/anulaciones.service");

const anularRecepcion = async (req, res, next) => {
    try {
        const resultado = await anulacionesService.anularRecepcion(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularMantenimiento = async (req, res, next) => {
    try {
        const resultado = await anulacionesService.anularMantenimiento(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const revertirAjuste = async (req, res, next) => {
    try {
        const resultado = await anulacionesService.revertirAjuste(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    anularRecepcion,
    anularMantenimiento,
    revertirAjuste
};
