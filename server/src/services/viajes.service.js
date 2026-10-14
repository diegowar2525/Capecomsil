const costoModel = require("../models/costo_viaje.model");
const remuneracionModel = require("../models/remuneracion_chofer.model");
const pool = require("../config/database");
const viajeModel = require("../models/viaje.model");
const tramoModel = require("../models/tramo_viaje.model");
const trayectoModel = require("../models/trayecto.model");
const { validateRecorrido } = require("../utils/validators/tramo_viaje.validators");
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
        await remuneracionModel.lock(client);
        const trayectos = new Map();
        for (const id of [...new Set(validado.tramos.map(t => t.id_trayecto))].sort((a, b) => a - b)) {
            const trayecto = await trayectoModel.findByIdForShare(client, id);
            if (!trayecto) throw createHttpError("El trayecto indicado no existe", 400);
            if (!trayecto.estado) throw createHttpError("El trayecto indicado está inactivo", 409);
            trayectos.set(id, trayecto);
        }
        const recorrido = validado.tramos.map(t => ({ ...trayectos.get(t.id_trayecto), ...t }));
        validateRecorrido(recorrido, validado.detalles);
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
                const tarifa = await tarifaModel.findVigenteForUpdate(client, detalle.id_gasolinera, detalle.id_terminal, validado.fecha);
                if (!tarifa) throw createHttpError(`No existe tarifa vigente para gasolinera ${detalle.id_gasolinera} y terminal ${detalle.id_terminal}`);
                tarifas.set(clave, tarifa);
            }
        }
        const viaje = await viajeModel.create(client, validado);
        const tramos = [];
        for (const tramo of recorrido) {
            tramos.push(await tramoModel.create(client, viaje.id_viaje, tramo));
        }
        const detalles = [];
        for (const detalle of validado.detalles) {
            const tarifa = tarifas.get(`${detalle.id_gasolinera}:${detalle.id_terminal}`);
            detalles.push(await detalleModel.create(client, viaje.id_viaje, detalle, tarifa));
        }
        await remuneracionModel.recalcular(client, validado.id_chofer, validado.fecha);
        const totales = await viajeModel.getTotales(client, viaje.id_viaje);
        const costos = await costoModel.findByViaje(viaje.id_viaje, client);
        await client.query("COMMIT");
        return { ...viaje, ...totales, detalles, tramos, costos };
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
    return { ...viaje, costos: await costoModel.findByViaje(id), detalles: await detalleModel.findByViaje(id), tramos: await tramoModel.findByViaje(id) };
};

const anularViaje = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await remuneracionModel.lock(client);
        const viaje = await viajeModel.findByIdForUpdate(client, id);
        if (!viaje) throw createHttpError("Viaje no encontrado", 404);
        if (viaje.estado === "ANULADO") throw createHttpError("El viaje ya está anulado");
        const detalles = await detalleModel.findByViajeForUpdate(client, id);
        if (detalles.some(d => d.id_liquidacion !== null)) throw createHttpError("No se puede anular un viaje con entregas asociadas a una liquidación");
        await viajeModel.anular(client, id, motivo);
        await remuneracionModel.recalcular(client, viaje.id_chofer, viaje.fecha);
        const resultado = await viajeModel.findById(id, client);
        const entregas = await detalleModel.findByViaje(id, client);
        const tramos = await tramoModel.findByViaje(id, client);
        const costos = await costoModel.findByViaje(id, client);
        await client.query("COMMIT");
        return { ...resultado, detalles: entregas, tramos, costos };
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
