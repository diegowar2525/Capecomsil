const vehiculoModel = require("../models/vehiculo.model");
const pool = require("../config/database");
const { lock } = require("../utils/transaction.lock");
const { validateFiltros } = require("../utils/validators/plan_mantenimiento.validators");
const { createHttpError } = require("../utils/errors/http.error");
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

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const vehiculo = await vehiculoModel.update(idNumerico,datosValidados,client);
        if (!vehiculo) throw createHttpError("Vehículo no encontrado",404);
        await client.query("COMMIT");
        return vehiculo;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
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
    getKilometraje: async (id, query) => {
        const filtros = validateFiltros(query);
        const resultado = await vehiculoModel.getKilometraje(validateId(id),filtros.fecha_hasta);
        if (!resultado) throw createHttpError("Vehículo no encontrado",404);
        return resultado;
    },
    getVehiculos,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo
};
