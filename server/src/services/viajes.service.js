const pool = require("../config/database");
const viajeModel = require("../models/viaje.model");
const tramoModel = require("../models/tramo_viaje.model");
const detalleModel = require("../models/detalle_viaje.model");
const vehiculoModel = require("../models/vehiculo.model");
const choferModel = require("../models/chofer.model");
const productoModel = require("../models/producto_transportado.model");
const tarifaModel = require("../models/tarifa.model");
const { validateData, validateFiltros } = require("../utils/validators/viaje.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const createViaje = async (data) => {
    const validado = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        if (!await vehiculoModel.findByIdForShare(client, validado.id_vehiculo)) throw createHttpError("El vehículo no existe", 400);
        if (!await choferModel.findByIdForShare(client, validado.id_chofer)) throw createHttpError("El chofer no existe", 400);
        const capacidad = await vehiculoModel.getCapacidadViaje(client, validado.id_vehiculo, validado.detalles.map(d => d.galones));
        if (!capacidad.suficiente) throw createHttpError("Los galones del viaje exceden la capacidad máxima del vehículo", 400);
        const productos = [...new Set(validado.detalles.map(d => d.id_producto_transportado))].sort((a, b) => a - b);
        for (const id of productos) {
            if (!await productoModel.findByIdForShare(client, id)) throw createHttpError("El producto transportado no existe", 400);
        }
        const tarifas = new Map();
        // Orden estable para viajes que comparten varias tarifas.
        const ordenados = [...validado.detalles].sort((a, b) => a.id_gasolinera - b.id_gasolinera || a.id_terminal - b.id_terminal);
        for (const detalle of ordenados) {
            const clave = `${detalle.id_gasolinera}:${detalle.id_terminal}`;
            if (!tarifas.has(clave)) {
                const tarifa = await tarifaModel.findVigenteForUpdate(client, detalle.id_gasolinera, detalle.id_terminal, validado.fecha_inicio.slice(0, 10));
                if (!tarifa) throw createHttpError(`No existe tarifa vigente para gasolinera ${detalle.id_gasolinera} y terminal ${detalle.id_terminal}`);
                tarifas.set(clave, tarifa);
            }
        }
        const viaje = await viajeModel.create(client, validado);
        const tramos = [];
        for (const tramo of validado.tramos) {
            tramos.push(await tramoModel.create(client, viaje.id_viaje, tramo));
        }
        const detalles = [];
        for (const detalle of validado.detalles) {
            const tarifa = tarifas.get(`${detalle.id_gasolinera}:${detalle.id_terminal}`);
            detalles.push(await detalleModel.create(client, viaje.id_viaje, detalle, tarifa));
        }
        const totales = await viajeModel.getTotales(client, viaje.id_viaje);
        await client.query("COMMIT");
        return { ...viaje, ...totales, detalles, tramos };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") throw createHttpError("Los importes del viaje exceden el límite permitido", 400);
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
    if (!viaje) throw createHttpError("Viaje no encontrado", 404);
    return { ...viaje, detalles: await detalleModel.findByViaje(id), tramos: await tramoModel.findByViaje(id) };
};

const anularViaje = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const viaje = await viajeModel.findByIdForUpdate(client, id);
        if (!viaje) throw createHttpError("Viaje no encontrado", 404);
        if (viaje.estado === "ANULADO") throw createHttpError("El viaje ya está anulado");
        const detalles = await detalleModel.findByViajeForUpdate(client, id);
        if (detalles.some(d => d.id_liquidacion !== null)) throw createHttpError("No se puede anular un viaje con entregas asociadas a una liquidación");
        await viajeModel.anular(client, id, motivo);
        const resultado = await viajeModel.findById(id, client);
        const entregas = await detalleModel.findByViaje(id, client);
        const tramos = await tramoModel.findByViaje(id, client);
        await client.query("COMMIT");
        return { ...resultado, detalles: entregas, tramos };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { getViajes, getViajeById, anularViaje, createViaje };
