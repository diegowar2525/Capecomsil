const pool = require("../config/database");
const tarifaCapacidadModel = require("../models/tarifa_capacidad.model");
const gasolineraModel = require("../models/gasolinera.model");
const { validateData } = require("../utils/validators/tarifa_capacidad.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");
const { lock } = require("../utils/transaction.lock");

const findAll = async () => {
    return tarifaCapacidadModel.findAll();
};

const findById = async (id) => {
    const idValidado = validateId(id);
    const resultado = await tarifaCapacidadModel.findById(idValidado);
    if (!resultado) {
        throw createHttpError("Tarifa por capacidad no encontrada", 404);
    }
    return resultado;
};

const mutate = async (action, id, datosValidados) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);

        if (action !== "remove" && !await gasolineraModel.findById(datosValidados.id_gasolinera, client)) {
            throw createHttpError("La gasolinera no existe", 400);
        }
        const resultado = action === "create"
            ? await tarifaCapacidadModel.create(datosValidados, client)
            : action === "update"
                ? await tarifaCapacidadModel.update(id, datosValidados, client)
                : await tarifaCapacidadModel.remove(id, client);

        if (!resultado) {
            throw createHttpError("Tarifa por capacidad no encontrada", 404);
        }
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const create = async (data) => {
    const datosValidados = validateData(data);
    return mutate("create", null, datosValidados);
};

const update = async (id, data) => {
    const idValidado = validateId(id);
    const datosValidados = validateData(data);
    return mutate("update", idValidado, datosValidados);
};

const remove = async (id) => {
    const idValidado = validateId(id);
    return mutate("remove", idValidado);
};

module.exports = { findAll, findById, create, update, remove };
