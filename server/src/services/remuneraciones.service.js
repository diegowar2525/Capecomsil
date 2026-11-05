const { lock } = require("../utils/transaction.lock");
const pool = require("../config/database");
const remuneracionChoferModel = require("../models/remuneracion_chofer.model");
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
    return result;
};

const completarPendientes = async () => {
    const choferes = await remuneracionChoferModel.findChoferesAutomaticos();
    let generadas = 0;
    const fallos = [];
    for (const { id_chofer } of choferes) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await lock(client);
            const fechas = await remuneracionChoferModel.findPendientes(id_chofer, client);
            for (const { fecha } of fechas) await remuneracionChoferModel.recalcular(client, id_chofer, fecha);
            await client.query("COMMIT");
            generadas += fechas.length;
        } catch (error) {
            await client.query("ROLLBACK");
            fallos.push({ id_chofer, code: error.code });
        } finally { client.release(); }
    }
    return { generadas, fallos };
};

const cobertura = async query => {
    const result = await remuneracionChoferModel.findCobertura(validatePeriodo(query));
    if (!result) throw createHttpError('Chofer no encontrado',404);
    return result;
};

module.exports = {
    completarPendientes, cobertura,
    generar,
    findAll,
    findById
};
