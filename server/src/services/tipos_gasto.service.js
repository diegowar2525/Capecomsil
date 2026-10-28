const pool = require("../config/database");
const tipoGastoModel = require("../models/tipo_gasto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/tipo_gasto.validators");
const { createHttpError } = require("../utils/errors/http.error");
const { lock } = require("../utils/transaction.lock");

const getTiposGasto = async () => {
    return await tipoGastoModel.findAll();
};

const getTipoGastoById = async (id, client = pool) => {
    const registro = await tipoGastoModel.findById(validateId(id), client);
    if (!registro) {
        throw createHttpError("Tipo de gasto no encontrado", 404);
    }
    return registro;
};

const createTipoGasto = async (data) => {
    const datosValidados = validateData(data);
    try {
        return await tipoGastoModel.create(datosValidados);
    } catch (error) {
        if (error.code === "23505") {
            throw createHttpError("Ya existe un tipo de gasto con ese código", 409);
        }
        throw error;
    }
};

const modificarTipoGasto = async (id, data, eliminar) => {
    const idNumerico = validateId(id);
    const datosValidados = eliminar ? null : validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const registro = await getTipoGastoById(idNumerico, client);
        if (registro.reservado && (eliminar || !datosValidados.estado)) {
            throw createHttpError("El tipo reservado no se puede eliminar ni desactivar", 409);
        }
        if (!eliminar && datosValidados.codigo !== registro.codigo) {
            throw createHttpError("El código del tipo de gasto no se puede cambiar", 409);
        }
        const resultado = eliminar
            ? await tipoGastoModel.remove(idNumerico, client)
            : await tipoGastoModel.update(idNumerico, datosValidados, client);
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        if (["23503", "23001"].includes(error.code)) {
            throw createHttpError("El tipo tiene gastos asociados; puede desactivarlo, pero no eliminarlo", 409);
        }
        throw error;
    } finally {
        client.release();
    }
};

const updateTipoGasto = async (id, data) => {
    return await modificarTipoGasto(id, data, false);
};

const deleteTipoGasto = async (id) => {
    return await modificarTipoGasto(id, null, true);
};

module.exports = { getTiposGasto, getTipoGastoById, createTipoGasto, updateTipoGasto, deleteTipoGasto };
