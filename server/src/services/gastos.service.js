const pool = require("../config/database");
const tipoGastoModel = require("../models/tipo_gasto.model");
const gastoModel = require("../models/gasto.model");
const mantenimientoModel = require("../models/mantenimiento.model");
const { lock } = require("../utils/transaction.lock");
const { validateData, validateFiltros } = require("../utils/validators/gasto.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const validarReferencias = async (client, data) => {
    const referencias = await gastoModel.referencias(client, data);
    for (const [campo, registro] of [
        ["id_vehiculo", referencias.vehiculo],
        ["id_proveedor", referencias.proveedor],
        ["id_viaje", referencias.viaje],
        ["id_viatico_chofer", referencias.viatico]
    ]) {
        if (data[campo] && !registro) {
            throw createHttpError(`No existe la referencia ${campo}`, 400);
        }
    }
    if (referencias.viaje) {
        if (referencias.viaje.estado !== "REGISTRADO") {
            throw createHttpError("No se pueden agregar gastos a un viaje anulado", 409);
        }
        if (data.id_vehiculo && data.id_vehiculo !== referencias.viaje.id_vehiculo) {
            throw createHttpError("El vehículo no corresponde al viaje", 400);
        }
        data.id_vehiculo = referencias.viaje.id_vehiculo;
    }
};

const getGastos = async (query) => {
    return gastoModel.findAll(validateFiltros(query));
};

const getGastoById = async (id) => {
    const gasto = await gastoModel.findById(validateId(id));
    if (!gasto) {
        throw createHttpError("Gasto no encontrado", 404);
    }
    return gasto;
};

const createGasto = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        if (datosValidados.origen === "OPERATIVO") {
            const tipo = await tipoGastoModel.findByIdForShare(client, datosValidados.id_tipo_gasto);
            if (!tipo) {
                throw createHttpError("Seleccione un tipo de gasto existente", 400);
            }
            if (!tipo.estado) {
                throw createHttpError("El tipo de gasto está inactivo", 409);
            }
        }
        await validarReferencias(client, datosValidados);
        const nuevo = await gastoModel.create(client, datosValidados);
        const gasto = await gastoModel.findById(nuevo.id_gasto, client);
        await client.query("COMMIT");
        return gasto;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const anularGasto = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const actual = await gastoModel.findById(id, client);
        if (!actual) {
            throw createHttpError("Gasto no encontrado", 404);
        }
        if (actual.id_pago_proveedor) {
            throw createHttpError("Anule el pago desde Pagos a proveedores", 409);
        }
        if (actual.id_mantenimiento) {
            const trabajo = await mantenimientoModel.findByIdForUpdate(client, actual.id_mantenimiento);
            if (trabajo.pago_directo_automatico) {
                throw createHttpError("Este gasto se corrige o anula desde el mantenimiento asociado", 409);
            }
        }
        if (!(await gastoModel.anular(client, id, motivo))) {
            throw createHttpError("El gasto ya está anulado", 409);
        }
        const gasto = await gastoModel.findById(id, client);
        await client.query("COMMIT");
        return gasto;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getGastos,
    getGastoById,
    createGasto,
    anularGasto,
    validarReferencias
};
