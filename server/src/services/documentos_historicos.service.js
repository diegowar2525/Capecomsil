const pool = require('../config/database');
const model = require('../models/documento_historico.model');
const { validateData } = require('../utils/validators/documento_historico.validators');
const { lock } = require('../utils/transaction.lock');
const { createHttpError } = require('../utils/errors/http.error');
// Reutilizable por la carga por dependencias: el llamador controla BEGIN/COMMIT.
const createEnTransaccion = async (client, tipo, data) => {
    const validado = validateData(data, tipo);
    await lock(client);
    return tipo === 'CLIENTE' ? model.createCliente(client, validado) : model.createProveedor(client, validado);
};
const create = async (tipo, data) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await createEnTransaccion(client, tipo, data);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') throw createHttpError('Documento o fila de origen ya registrada', 409);
        throw error;
    } finally {
        client.release();
    }
};
module.exports = { create, createEnTransaccion };
