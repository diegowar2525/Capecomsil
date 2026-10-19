const terminalesService = require("../services/terminales.service");

const getTerminales = async (req, res, next) => {
    try {
        const resultado = await terminalesService.getTerminales();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getTerminalById = async (req, res, next) => {
    try {
        const resultado = await terminalesService.getTerminalById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createTerminal = async (req, res, next) => {
    try {
        const resultado = await terminalesService.createTerminal(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateTerminal = async (req, res, next) => {
    try {
        const resultado = await terminalesService.updateTerminal(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteTerminal = async (req, res, next) => {
    try {
        const resultado = await terminalesService.deleteTerminal(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTerminales,
    getTerminalById,
    createTerminal,
    updateTerminal,
    deleteTerminal
};
