const trayectosService = require("../services/trayectos.service");

const getTrayectos = async (req, res, next) => {
    try {
        const trayectos =
            await trayectosService.getTrayectos();

        res.json(trayectos);
    } catch (error) {
        next(error);
    }
};

const getTrayectoById = async (req, res, next) => {
    try {
        const trayecto =
            await trayectosService.getTrayectoById(
                req.params.id
            );

        res.json(trayecto);
    } catch (error) {
        next(error);
    }
};

const createTrayecto = async (req, res, next) => {
    try {
        const trayecto =
            await trayectosService.createTrayecto(
                req.body
            );

        res.status(201).json(trayecto);
    } catch (error) {
        next(error);
    }
};

const updateTrayecto = async (req, res, next) => {
    try {
        const trayecto =
            await trayectosService.updateTrayecto(
                req.params.id,
                req.body
            );

        res.json(trayecto);
    } catch (error) {
        next(error);
    }
};

const deleteTrayecto = async (req, res, next) => {
    try {
        const trayecto =
            await trayectosService.deleteTrayecto(
                req.params.id
            );

        res.json({
            message: "Trayecto eliminado correctamente",
            trayecto
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTrayectos,
    getTrayectoById,
    createTrayecto,
    updateTrayecto,
    deleteTrayecto
};
