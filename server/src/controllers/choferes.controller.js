const ChoferService = require("../services/choferes.service");

const getChoferes = async (req, res, next) => {
    try {
        const choferes = await ChoferService.getChoferes();

        res.json(choferes);
    } catch (error) {
        next(error);
    }
};

const getChoferById = async (req, res, next) => {
    try {
        const chofer = await ChoferService.getChoferById(
            req.params.id
        );
        res.json(chofer);
    } catch (error) {
        next(error);
    }
};

const createChofer = async (req, res, next) => {
    try {
        const chofer = await ChoferService.createChofer(
            req.body
        );

        res.status(201).json(chofer);
    } catch (error) {
        next(error);
    }
};

const updateChofer = async (req, res, next) => {
    try {
        const chofer = await ChoferService.updateChofer(
            req.params.id,
            req.body
        );

        res.json(chofer);
    } catch (error) {
        next(error);
    }
};

const deleteChofer = async (req, res, next) => {
    try {
        const chofer = await ChoferService.deleteChofer(
            req.params.id
        );

        return res.json(chofer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer,
};