const vehiculosService = require("../services/vehiculos.service");

const getVehiculos = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.getVehiculos();
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const getVehiculoById = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.getVehiculoById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const createVehiculo = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.createVehiculo(req.body);
        return res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updateVehiculo = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.updateVehiculo(req.params.id, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const deleteVehiculo = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.deleteVehiculo(req.params.id);
        return res.status(200).json({
            message: "Vehículo eliminado correctamente",
            vehiculo: resultado
        });
    } catch (error) {
        next(error);
    }
};

const getKilometraje = async (req, res, next) => {
    try {
        const resultado = await vehiculosService.getKilometraje(req.params.id, req.query);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getKilometraje,
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
};
