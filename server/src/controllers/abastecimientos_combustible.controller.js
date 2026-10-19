const abastecimientosCombustibleService = require("../services/abastecimientos_combustible.service");

const getAbastecimientos = async (req, res, next) => {
    try {
        const resultado = await abastecimientosCombustibleService.getAbastecimientos(req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getAbastecimientoById = async (req, res, next) => {
    try {
        const resultado = await abastecimientosCombustibleService.getAbastecimientoById(
            req.params.id
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createAbastecimiento = async (req, res, next) => {
    try {
        const resultado = await abastecimientosCombustibleService.createAbastecimiento(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const anularAbastecimiento = async (req, res, next) => {
    try {
        const resultado = await abastecimientosCombustibleService.anularAbastecimiento(
            req.params.id,
            req.body
        );
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAbastecimientos,
    getAbastecimientoById,
    createAbastecimiento,
    anularAbastecimiento
};
