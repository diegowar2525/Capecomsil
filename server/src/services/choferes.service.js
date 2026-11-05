const pool = require('../config/database');
const { lock } = require('../utils/transaction.lock');
const { createHttpError } = require("../utils/errors/http.error");
const choferModel = require("../models/chofer.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/chofer.validators");

const getChoferes = async () => {
    return await choferModel.findAll();
};

const getChoferById = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.findById(idNumerico);
    if (!chofer) {
        throw createHttpError("Chofer no encontrado.", 404);
    }
    return chofer;
};

const createChofer = async (data) => {
    const datosValidados = validateData(data);
    if (!datosValidados.fecha_inicio_trabajo) throw createHttpError('La fecha de inicio de trabajo es obligatoria.',400);
    return await choferModel.create(datosValidados);
};

const updateChofer = async (id, data) => {
    const idNumerico = validateId(id);
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await lock(client);
        const anterior = await choferModel.findById(idNumerico, client);
        if (!anterior) throw createHttpError('Chofer no encontrado.',404);
        if (anterior.fecha_inicio_trabajo && !datosValidados.fecha_inicio_trabajo) throw createHttpError('No se puede quitar la fecha de inicio de trabajo.',400);
        const chofer = await choferModel.update(idNumerico, datosValidados, client);
        await client.query('COMMIT');
        return chofer;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
};

const deleteChofer = async (id) => {
    const idNumerico = validateId(id);
    const chofer = await choferModel.remove(idNumerico);
    if (!chofer) {
        throw createHttpError("Chofer no encontrado.", 404);
    }
    return chofer;
};

module.exports = {
    getChoferes,
    getChoferById,
    createChofer,
    updateChofer,
    deleteChofer
};
