const pool = require("../config/database");
const viajeModel = require("../models/viaje.model");
const detalleModel = require("../models/detalle_viaje.model");
const vehiculoModel = require("../models/vehiculo.model");
const choferModel = require("../models/chofer.model");
const productoModel = require("../models/producto_transportado.model");
const tarifaModel = require("../models/tarifa.model");
const { validateData } = require("../utils/validators/viaje.validators");
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
                const tarifa = await tarifaModel.findVigenteForUpdate(client, detalle.id_gasolinera, detalle.id_terminal, validado.fecha);
                if (!tarifa) throw createHttpError(`No existe tarifa vigente para gasolinera ${detalle.id_gasolinera} y terminal ${detalle.id_terminal}`);
                tarifas.set(clave, tarifa);
            }
        }
        const viaje = await viajeModel.create(client, validado);
        const detalles = [];
        for (const detalle of validado.detalles) {
            const tarifa = tarifas.get(`${detalle.id_gasolinera}:${detalle.id_terminal}`);
            detalles.push(await detalleModel.create(client, viaje.id_viaje, detalle, tarifa));
        }
        const totales = await viajeModel.getTotales(client, viaje.id_viaje);
        await client.query("COMMIT");
        return { ...viaje, ...totales, detalles };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") throw createHttpError("Los importes del viaje exceden el límite permitido", 400);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { createViaje };
