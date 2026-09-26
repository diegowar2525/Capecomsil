const productosTransportadosService = require(
    "../services/productos_transportados.service"
);

const getProductosTransportados = async (req, res, next) => {
    try {
        const productos =
            await productosTransportadosService
                .getProductosTransportados();

        res.json(productos);
    } catch (error) {
        next(error);
    }
};

const getProductoTransportadoById = async (req, res, next) => {
    try {
        const producto =
            await productosTransportadosService
                .getProductoTransportadoById(req.params.id);

        res.json(producto);
    } catch (error) {
        next(error);
    }
};

const createProductoTransportado = async (req, res, next) => {
    try {
        const producto =
            await productosTransportadosService
                .createProductoTransportado(req.body);

        res.status(201).json(producto);
    } catch (error) {
        next(error);
    }
};

const updateProductoTransportado = async (req, res, next) => {
    try {
        const producto =
            await productosTransportadosService
                .updateProductoTransportado(
                    req.params.id,
                    req.body
                );

        res.json(producto);
    } catch (error) {
        next(error);
    }
};

const deleteProductoTransportado = async (req, res, next) => {
    try {
        const producto =
            await productosTransportadosService
                .deleteProductoTransportado(req.params.id);

        res.json({
            message: "Producto transportado eliminado correctamente",
            producto
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