const service = require("../services/anulaciones.service");

const anularRecepcion = async (req, res, next) => {
    try {
        res.json(await service.anularRecepcion(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

const anularMantenimiento = async (req, res, next) => {
    try {
        res.json(await service.anularMantenimiento(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

const revertirAjuste = async (req, res, next) => {
    try {
        res.json(await service.revertirAjuste(req.params.id, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { anularRecepcion, anularMantenimiento, revertirAjuste };
