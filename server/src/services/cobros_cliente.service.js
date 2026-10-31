const pool = require("../config/database");
const cobroModel = require("../models/cobro_cliente.model");
const facturaModel = require("../models/factura_cliente.model");
const validators = require("../utils/validators/cobro_cliente.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");
const { lock } = require("../utils/transaction.lock");
const findAll = query => cobroModel.findAll(validators.validateFiltros(query));
const findById = async id => {
    const result = await cobroModel.findById(validateId(id));
    if (!result) {
        throw createHttpError("Cobro no encontrado", 404);
    }
    return result;
};
const create = async (data, usuario) => {
    const datosValidados = validators.validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const factura = await facturaModel.findByIdForUpdate(client, datosValidados.id_factura);
        if (!factura) {
            throw createHttpError("Factura no encontrada", 404);
        }
        if (factura.estado === "ANULADA") {
            throw createHttpError("No se admiten cobros de una factura anulada", 409);
        }
        if (datosValidados.fecha_pago < factura.fecha_emision) {
            throw createHttpError("El cobro no puede preceder a la emisión", 400);
        }
        const created = await cobroModel.create(client, datosValidados, usuario);
        if (!created) {
            throw createHttpError("El monto supera el saldo pendiente de la factura", 409);
        }
        const result = { ...await cobroModel.findById(created.id_pago, client), factura: await facturaModel.findById(datosValidados.id_factura, client) };
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
const anular = async (id, data, usuario) => {
    id = validateId(id);
    const { motivo } = validators.validateAnulacion(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const cobro = await cobroModel.findById(id, client);
        if (!cobro) {
            throw createHttpError("Cobro no encontrado", 404);
        }
        await facturaModel.findByIdForUpdate(client, cobro.id_factura);
        if (cobro.estado === "ANULADO") {
            throw createHttpError("El cobro ya está anulado", 409);
        }
        await cobroModel.anular(client, id, motivo, usuario);
        const result = { ...await cobroModel.findById(id, client), factura: await facturaModel.findById(cobro.id_factura, client) };
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
module.exports = { findAll, findById, create, anular };
