const viajesService = require("../services/viajes.service");

const createViaje = async (req, res, next) => {
    try {
        res.status(201).json(await viajesService.createViaje(req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { createViaje };
