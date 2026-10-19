const pool = require("../config/database");
const feriadoModel = require("../models/feriado.model");
const { lock } = require("../utils/transaction.lock");
const { validateFeriado } = require("../utils/validators/remuneracion.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const mutate = async (action, id, data) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const result =
            action === "create"
                ? await feriadoModel.create(client, data)
                : action === "update"
                  ? await feriadoModel.update(client, id, data)
                  : await feriadoModel.remove(client, id);
        if (!result) {
            throw createHttpError("Registro no encontrado", 404);
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

const findAll = async () => {
    return feriadoModel.findAll();
};

const findById = async (id) => {
    const result = await feriadoModel.findById(validateId(id));
    if (!result) {
        throw createHttpError("Registro no encontrado", 404);
    }
    return result;
};

const create = async (data) => {
    return mutate("create", null, validateFeriado(data));
};

const update = async (id, data) => {
    return mutate("update", validateId(id), validateFeriado(data));
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
