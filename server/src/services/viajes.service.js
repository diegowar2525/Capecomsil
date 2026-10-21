const preparacionService = require("./viajes_preparacion.service");
const { lock } = require("../utils/transaction.lock");
const viaticoService = require("./viaticos_chofer.service");
const costoService = require("./costos_viaje.service");
const costoModel = require("../models/costo_viaje.model");
const remuneracionModel = require("../models/remuneracion_chofer.model");
const pool = require("../config/database");
const viajeModel = require("../models/viaje.model");
const tramoModel = require("../models/tramo_viaje.model");
const detalleModel = require("../models/detalle_viaje.model");
const { validateData, validateFiltros } = require("../utils/validators/viaje.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const createViaje = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const { recorrido, tarifas } = await preparacionService.preparar(client, datosValidados);
        const viaje = await viajeModel.create(client, datosValidados);
        const tramos = [];
        for (const tramo of recorrido) {
            tramos.push(await tramoModel.create(client, viaje.id_viaje, tramo));
        }
        for (const detalle of datosValidados.detalles) {
            const tarifa = tarifas.get(`${detalle.id_gasolinera}:${detalle.id_terminal}`);
            await detalleModel.create(client, viaje.id_viaje, detalle, tarifa);
        }
        await remuneracionModel.recalcular(
            client,
            datosValidados.id_chofer,
            datosValidados.fecha_inicio.slice(0, 10)
        );
        await costoService.crearAutomaticos(
            client,
            viaje.id_viaje,
            datosValidados.fecha_inicio.slice(0, 10)
        );
        await viaticoService.recalcular(
            client,
            datosValidados.id_chofer,
            datosValidados.fecha_inicio.slice(0, 10)
        );
        const totales = await viajeModel.getTotales(client, viaje.id_viaje);
        const costos = await costoModel.findByViaje(viaje.id_viaje, client);
        // Misma representación del GET, incluyendo la liquidación vigente calculada.
        const detalles = await detalleModel.findByViaje(viaje.id_viaje, client);
        await client.query("COMMIT");
        return {
            ...viaje,
            ...totales,
            detalles,
            tramos,
            costos
        };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") {
            throw createHttpError("Los importes del viaje exceden el límite permitido", 400);
        }
        throw error;
    } finally {
        client.release();
    }
};

const getViajes = async (query) => {
    return await viajeModel.findAll(validateFiltros(query));
};

const getViajeById = async (id) => {
    id = validateId(id);
    const viaje = await viajeModel.findById(id);
    if (!viaje) {
        throw createHttpError("Viaje no encontrado", 404);
    }
    return {
        ...viaje,
        costos: await costoModel.findByViaje(id),
        detalles: await detalleModel.findByViaje(id),
        tramos: await tramoModel.findByViaje(id)
    };
};

const anularViaje = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const viaje = await viajeModel.findByIdForUpdate(client, id);
        if (!viaje) {
            throw createHttpError("Viaje no encontrado", 404);
        }
        if (viaje.estado === "ANULADO") {
            throw createHttpError("El viaje ya está anulado", 409);
        }
        const detalles = await detalleModel.findByViajeForUpdate(client, id);
        if (
            detalles.some((d) => {
                return d.id_liquidacion !== null;
            })
        ) {
            throw createHttpError(
                "No se puede anular un viaje con entregas asociadas a una liquidación",
                409
            );
        }
        await viajeModel.anular(client, id, motivo);
        await remuneracionModel.recalcular(
            client,
            viaje.id_chofer,
            viaje.fecha_inicio.slice(0, 10)
        );
        await viaticoService.recalcular(client, viaje.id_chofer, viaje.fecha_inicio.slice(0, 10));
        const resultado = await viajeModel.findById(id, client);
        const entregas = await detalleModel.findByViaje(id, client);
        const tramos = await tramoModel.findByViaje(id, client);
        const costos = await costoModel.findByViaje(id, client);
        await client.query("COMMIT");
        return {
            ...resultado,
            detalles: entregas,
            tramos,
            costos
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getViajes,
    getViajeById,
    anularViaje,
    createViaje
};
