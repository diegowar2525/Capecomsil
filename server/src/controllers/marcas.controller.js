const marcasService = require("../services/marcas.service");

const getMarcas = async (req, res, next) => {
    try {
        const resultado = await marcasService.getMarcas(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getMarcaById = async (req, res, next) => {
    try {
        const resultado = await marcasService.getMarcaById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createMarca = async (req, res, next) => {
    try {
        const resultado = await marcasService.createMarca(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateMarca = async (req, res, next) => {
    try {
        const resultado = await marcasService.updateMarca(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteMarca = async (req, res, next) => {
    try {
        const resultado = await marcasService.deleteMarca(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMarcas,
    getMarcaById,
    createMarca,
    updateMarca,
    deleteMarca
};
