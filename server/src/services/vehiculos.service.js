const vehiculoModel = require("../models/vehiculo.model");

const getVehiculos = async () => {
    return await vehiculoModel.findAll();
};

const getVehiculoById = async (id) => {
    const vehiculo = await vehiculoModel.findById(id);

    if (!vehiculo) {
        const error = new Error("Vehículo no encontrado");
        error.status = 404;
        throw error;
    }

    return vehiculo;
};

const createVehiculo = async (data) => {
    return await vehiculoModel.create(data);
};

const updateVehiculo = async (id, data) => {
    const vehiculo = await vehiculoModel.update(id, data);

    if (!vehiculo) {
        const error = new Error("Vehículo no encontrado");
        error.status = 404;
        throw error;
    }

    return vehiculo;
};

const deleteVehiculo = async (id) => {
    const vehiculo = await vehiculoModel.remove(id);

    if (!vehiculo) {
        const error = new Error("Vehículo no encontrado");
        error.status = 404;
        throw error;
    }

    return vehiculo;
};

module.exports = {
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
};