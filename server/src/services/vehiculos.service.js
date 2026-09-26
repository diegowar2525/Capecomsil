const vehiculoModel = require("../models/vehiculo.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/vehiculo.validators");

const getVehiculos = async () => {
    return await vehiculoModel.findAll();
};

const getVehiculoById = async (id) => {
    const idNumerico = validateId(id);

    const vehiculo = await vehiculoModel.findById(idNumerico);

    if (!vehiculo) {
        const error = new Error("Vehículo no encontrado");
        error.status = 404;
        throw error;
    }

    return vehiculo;
};

const createVehiculo = async (data) => {
    const datosValidados = validateData(data);

    return await vehiculoModel.create(datosValidados);
};

const updateVehiculo = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);

    const vehiculo = await vehiculoModel.update(
        idNumerico,
        datosValidados
    );

    if (!vehiculo) {
        const error = new Error("Vehículo no encontrado");
        error.status = 404;
        throw error;
    }

    return vehiculo;
};

const deleteVehiculo = async (id) => {
    const idNumerico = validateId(id);

    const vehiculo = await vehiculoModel.remove(idNumerico);

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