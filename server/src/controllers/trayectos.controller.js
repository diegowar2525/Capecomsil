const trayectosService = require("../services/trayectos.service");

const getTrayectos = async (req, res, next) => {
    try {
        const resultado = await trayectosService.getTrayectos();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getTrayectoById = async (req, res, next) => {
    try {
        const resultado = await trayectosService.getTrayectoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createTrayecto = async (req, res, next) => {
    try {
        const resultado = await trayectosService.createTrayecto(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateTrayecto = async (req, res, next) => {
    try {
        const resultado = await trayectosService.updateTrayecto(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteTrayecto = async (req, res, next) => {
    try {
        const resultado = await trayectosService.deleteTrayecto(req.params.id);
        return res.status(200).json({
            message: "Trayecto eliminado correctamente",
            trayecto: resultado
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
