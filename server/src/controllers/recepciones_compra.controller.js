const recepcionesCompraService = require("../services/recepciones_compra.service");

const createRecepcionCompra = async (req, res, next) => {
    try {
        const resultado = await recepcionesCompraService.createRecepcionCompra(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecepcionCompra
};
