const { lock } = require("../utils/transaction.lock");
const pool = require("../config/database");
const remuneracionChoferModel = require("../models/remuneracion_chofer.model");
const historialModel = require("../models/historial_remuneracion_chofer.model");
const { validatePeriodo } = require("../utils/validators/remuneracion.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const generar = async (data) => {
    const datosValidados = validatePeriodo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const fechas = await remuneracionChoferModel.findFechasPeriodo(client, datosValidados);
        for (const { fecha } of fechas) {
            await remuneracionChoferModel.recalcular(client, datosValidados.id_chofer, fecha);
        }
        const resultado = await remuneracionChoferModel.findAll(datosValidados, client);
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const findAll = async (query) => {
    return remuneracionChoferModel.findAll(validatePeriodo(query));
};

const findById = async (id) => {
    const result = await remuneracionChoferModel.findById(validateId(id));
    if (!result) {
        throw createHttpError("Remuneración no encontrada", 404);
    }
    return {
        ...result,
        historial: await historialModel.findByRemuneracion(result.id_remuneracion_chofer)
    };
};

const operacionBloqueada = () => {
    throw createHttpError(
        "El cierre y la reapertura están bloqueados hasta implementar usuarios y permisos",
        403
    );
};

module.exports = {
    generar,
    findAll,
    findById,
    operacionBloqueada
};
