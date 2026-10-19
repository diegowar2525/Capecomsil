const pool = require("../config/database");
const abastecimientoCombustibleModel = require("../models/abastecimiento_combustible.model");
const gastoModel = require("../models/gasto.model");
const { validarReferencias } = require("./gastos.service");
const { lock } = require("../utils/transaction.lock");
const {
    validateData,
    validateFiltros
} = require("../utils/validators/abastecimiento_combustible.validators");
const { validateId, validateDecimal } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const getAbastecimientos = async (query) => {
    return abastecimientoCombustibleModel.findAll(validateFiltros(query));
};

const getAbastecimientoById = async (id) => {
    const carga = await abastecimientoCombustibleModel.findById(validateId(id));
    if (!carga) {
        throw createHttpError("Abastecimiento no encontrado", 404);
    }
    return carga;
};

const createAbastecimiento = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        await validarReferencias(client, datosValidados);
        if (await abastecimientoCombustibleModel.validarOdometro(client, datosValidados)) {
            throw createHttpError(
                "La lectura del odómetro contradice otra carga o ya existe una carga en esa fecha y hora",
                409
            );
        }
        const monto = validateDecimal(
            await abastecimientoCombustibleModel.calcularMonto(client, datosValidados),
            "monto calculado",
            12,
            2
        );
        if (monto === "0.00") {
            throw createHttpError("El importe calculado debe ser al menos 0.01", 400);
        }
        const gasto = await gastoModel.create(client, {
            ...datosValidados,
            fecha: datosValidados.fecha_hora.slice(0, 10),
            tipo_gasto: "COMBUSTIBLE",
            monto,
            descripcion: "Abastecimiento de combustible",
            id_viaje: null,
            id_viatico_chofer: null
        });
        const nuevo = await abastecimientoCombustibleModel.create(
            client,
            datosValidados,
            gasto.id_gasto
        );
        const carga = await abastecimientoCombustibleModel.findById(
            nuevo.id_abastecimiento_combustible,
            client
        );
        await client.query("COMMIT");
        return carga;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const anularAbastecimiento = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const carga = await abastecimientoCombustibleModel.findById(id, client);
        if (!carga) {
            throw createHttpError("Abastecimiento no encontrado", 404);
        }
        if (!(await gastoModel.anular(client, carga.id_gasto, motivo))) {
            throw createHttpError("El abastecimiento ya está anulado", 409);
        }
        const resultado = await abastecimientoCombustibleModel.findById(id, client);
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getAbastecimientos,
    getAbastecimientoById,
    createAbastecimiento,
    anularAbastecimiento
};
