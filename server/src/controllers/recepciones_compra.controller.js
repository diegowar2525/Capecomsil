const recepcionesCompraService = require("../services/recepciones_compra.service");

const createRecepcionCompra = async (req, res, next) => {
    try {
        const recepcion = await recepcionesCompraService.createRecepcionCompra(req.body);
        res.status(201).json(recepcion);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecepcionCompra
};
