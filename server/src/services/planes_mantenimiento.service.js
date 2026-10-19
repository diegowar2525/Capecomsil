const pool = require("../config/database");
const planMantenimientoVehiculoModel = require("../models/plan_mantenimiento_vehiculo.model");
const vehiculoModel = require("../models/vehiculo.model");
const { lock } = require("../utils/transaction.lock");
const {
    validateData,
    validateFiltros
} = require("../utils/validators/plan_mantenimiento.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const mutate = async (action, id, data) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        if (
            action !== "remove" &&
            !(await vehiculoModel.findByIdForShare(client, data.id_vehiculo))
        ) {
            throw createHttpError("El vehículo indicado no existe", 400);
        }
        const result =
            action === "create"
                ? await planMantenimientoVehiculoModel.create(client, data)
                : action === "update"
                  ? await planMantenimientoVehiculoModel.update(client, id, data)
                  : await planMantenimientoVehiculoModel.remove(client, id);
        if (!result) {
            throw createHttpError("Plan no encontrado", 404);
        }
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const findAll = async (query) => {
    return planMantenimientoVehiculoModel.findAll(validateFiltros(query));
};

const findById = async (id, query) => {
    const result = (
        await planMantenimientoVehiculoModel.findAll(validateFiltros(query), validateId(id))
    )[0];
    if (!result) {
        throw createHttpError("Plan no encontrado", 404);
    }
    return result;
};

const create = async (data) => {
    return mutate("create", null, validateData(data));
};

const update = async (id, data) => {
    return mutate("update", validateId(id), validateData(data));
};

const remove = async (id) => {
    return mutate("remove", validateId(id));
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
