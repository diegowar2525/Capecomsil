const vehiculoService = require("../services/vehiculos.service");

const getVehiculos = async (req, res, next) => {
    try {
        const vehiculos = await vehiculoService.getVehiculos();

        res.json(vehiculos);
    } catch (error) {
        next(error);
    }
};

const getVehiculoById = async (req, res, next) => {
    try {
        const vehiculo = await vehiculoService.getVehiculoById(
            req.params.id
        );

        res.json(vehiculo);
    } catch (error) {
        next(error);
    }
};

const createVehiculo = async (req, res, next) => {
    try {
        const vehiculo = await vehiculoService.createVehiculo(
            req.body
        );

        res.status(201).json(vehiculo);
    } catch (error) {
        next(error);
    }
};

const updateVehiculo = async (req, res, next) => {
    try {
        const vehiculo = await vehiculoService.updateVehiculo(
            req.params.id,
            req.body
        );

        res.json(vehiculo);
    } catch (error) {
        next(error);
    }
};

const deleteVehiculo = async (req, res, next) => {
    try {
        const vehiculo = await vehiculoService.deleteVehiculo(
            req.params.id
        );

        res.json({
            message: "Vehículo eliminado correctamente",
            vehiculo
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
};