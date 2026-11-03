const pagosMantenimientoService = require("../services/pagos_mantenimiento.service");

const createPago = async (req, res, next) => {
    try {
        const resultado = await pagosMantenimientoService.createPago(req.params.id, req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};
module.exports = { createPago };
