const TerminalService = require("../services/terminales.service");

const getTerminales = async (req, res, next) => {
    try {
        const terminales = await TerminalService.getTerminales();
        res.json(terminales);
    } catch (error) {
        next(error);
    }
};

const getTerminalById = async (req, res, next) => {
    try {
        const terminal = await TerminalService.getTerminalById(
            req.params.id
        );

        res.json(terminal);
    } catch (error) {
        next(error);
    }
};

const createTerminal = async (req, res, next) => {
    try {
        const terminal = await TerminalService.createTerminal(req.body);
        res.status(201).json(terminal);
    } catch (error) {
        next(error);
    }
};

const updateTerminal = async (req, res, next) => {
    try {
        const terminal = await TerminalService.updateTerminal(
            req.params.id,
            req.body
        );

        res.json(terminal);
    } catch (error) {
        next(error);
    }
};

const deleteTerminal = async (req, res, next) => {
    try {
        const terminal = await TerminalService.deleteTerminal(
            req.params.id
        );

        res.json(terminal);
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