const tiposGastoService = require("../services/tipos_gasto.service");

const getTiposGasto = async (req, res, next) => {
    try {
        const resultado = await tiposGastoService.getTiposGasto();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getTipoGastoById = async (req, res, next) => {
    try {
        const resultado = await tiposGastoService.getTipoGastoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createTipoGasto = async (req, res, next) => {
    try {
        const resultado = await tiposGastoService.createTipoGasto(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateTipoGasto = async (req, res, next) => {
    try {
        const resultado = await tiposGastoService.updateTipoGasto(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteTipoGasto = async (req, res, next) => {
    try {
        const resultado = await tiposGastoService.deleteTipoGasto(req.params.id);
        return res.status(200).json({
            message: "Tipo de gasto eliminado correctamente",
            tipo: resultado
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTiposGasto,
    getTipoGastoById,
    createTipoGasto,
    updateTipoGasto,
    deleteTipoGasto
};
