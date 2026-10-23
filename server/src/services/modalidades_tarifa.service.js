const pool = require("../config/database");
const modalidadTarifaModel = require("../models/modalidad_tarifa.model");
const gasolineraModel = require("../models/gasolinera.model");
const { lock } = require("../utils/transaction.lock");
const { validateData, validateFiltros } = require("../utils/validators/modalidad_tarifa.validators");
const { createHttpError } = require("../utils/errors/http.error");

const findAll = async (query) => {
    const idGasolinera = validateFiltros(query);
    return modalidadTarifaModel.findAll(idGasolinera);
};

const create = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);

        if (!await gasolineraModel.findById(datosValidados.id_gasolinera, client)) {
            throw createHttpError("La gasolinera no existe", 400);
        }
        const anterior = await modalidadTarifaModel.findVigente(
            client, datosValidados.id_gasolinera, datosValidados.fecha_inicio
        );
        if (!anterior) {
            throw createHttpError("No existe un período de modalidad para esa fecha", 409);
        }
        if (anterior.modalidad === datosValidados.modalidad) {
            throw createHttpError("Esa modalidad ya está vigente en la fecha indicada", 409);
        }
        if (anterior.fecha_inicio === datosValidados.fecha_inicio) {
            throw createHttpError("Ya existe un cambio de modalidad en esa fecha", 409);
        }

        await modalidadTarifaModel.cerrar(client, anterior.id_modalidad_tarifa, datosValidados.fecha_inicio);
        const resultado = await modalidadTarifaModel.create(client, {
            ...datosValidados,
            fecha_fin: anterior.fecha_fin
        });

        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { findAll, create };
