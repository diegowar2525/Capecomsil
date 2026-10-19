const productosTransportadosService = require("../services/productos_transportados.service");

const getProductosTransportados = async (req, res, next) => {
    try {
        const resultado = await productosTransportadosService.getProductosTransportados();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getProductoTransportadoById = async (req, res, next) => {
    try {
        const resultado = await productosTransportadosService.getProductoTransportadoById(
            req.params.id
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createProductoTransportado = async (req, res, next) => {
    try {
        const resultado = await productosTransportadosService.createProductoTransportado(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateProductoTransportado = async (req, res, next) => {
    try {
        const resultado = await productosTransportadosService.updateProductoTransportado(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteProductoTransportado = async (req, res, next) => {
    try {
        const resultado = await productosTransportadosService.deleteProductoTransportado(
            req.params.id
        );
        return res.status(200).json({
            message: "Producto transportado eliminado correctamente",
            producto: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProductosTransportados,
    getProductoTransportadoById,
    createProductoTransportado,
    updateProductoTransportado,
    deleteProductoTransportado
};
