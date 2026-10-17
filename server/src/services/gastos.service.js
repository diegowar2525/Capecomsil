const pool = require("../config/database");
const model = require("../models/gasto.model");
const { lock } = require("../utils/transaction.lock");
const { validateData, validateFiltros } = require("../utils/validators/gasto.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const validarReferencias = async (client, data) => {
    const r = await model.referencias(client, data);
    for (const [campo, registro] of [["id_vehiculo", r.vehiculo], ["id_proveedor", r.proveedor], ["id_viaje", r.viaje], ["id_viatico_chofer", r.viatico]]) {
        if (data[campo] && !registro) throw createHttpError(`No existe la referencia ${campo}`, 400);
    }
    if (r.viaje) {
        if (r.viaje.estado !== "REGISTRADO") throw createHttpError("No se pueden agregar gastos a un viaje anulado");
        if (data.id_vehiculo && data.id_vehiculo !== r.viaje.id_vehiculo) throw createHttpError("El vehículo no corresponde al viaje", 400);
        data.id_vehiculo = r.viaje.id_vehiculo;
    }
};

const getGastos = async query => model.findAll(validateFiltros(query));

const getGastoById = async id => {
    const gasto = await model.findById(validateId(id));
    if (!gasto) throw createHttpError("Gasto no encontrado", 404);
    return gasto;
};

const createGasto = async data => {
    const validado = validateData(data);
    if (validado.tipo_gasto === "COMBUSTIBLE") throw createHttpError("Registre el combustible mediante abastecimientos para generar su gasto", 400);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        await validarReferencias(client, validado);
        const nuevo = await model.create(client, validado);
        const gasto = await model.findById(nuevo.id_gasto, client);
        await client.query("COMMIT");
        return gasto;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
};

const anularGasto = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        if (!await model.findById(id, client)) throw createHttpError("Gasto no encontrado", 404);
        if (!await model.anular(client, id, motivo)) throw createHttpError("El gasto ya está anulado");
        const gasto = await model.findById(id, client);
        await client.query("COMMIT");
        return gasto;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
};

module.exports = { 
    getGastos, 
    getGastoById, 
    createGasto, 
    anularGasto, 
    validarReferencias 
};
