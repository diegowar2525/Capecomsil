const pool = require("../config/database");
const viajeModel = require("../models/viaje.model");
const detalleModel = require("../models/detalle_viaje.model");
const tramoModel = require("../models/tramo_viaje.model");
const costoModel = require("../models/costo_viaje.model");
const historialModel = require("../models/viaje_historial.model");
const remuneracionModel = require("../models/remuneracion_chofer.model");
const preparacionService = require("./viajes_preparacion.service");
const costoService = require("./costos_viaje.service");
const viaticoService = require("./viaticos_chofer.service");
const { validateEdicion } = require("../utils/validators/viaje.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");
const { lock } = require("../utils/transaction.lock");

const consultar = async (client, id) => {
    return {
        ...await viajeModel.findById(id, client),
        detalles: await detalleModel.findByViaje(id, client),
        tramos: await tramoModel.findByViaje(id, client),
        costos: await costoModel.findByViaje(id, client)
    };
};

const validarPertenencia = (nuevos, anteriores, campo) => {
    const ids = new Set(anteriores.map((item) => item[campo]));
    if (nuevos.some((item) => item[campo] !== null && !ids.has(item[campo]))) {
        throw createHttpError("La entrega o tramo no pertenece al viaje", 400);
    }
};

const updateViaje = async (id, data, idActor) => {
    const idViaje = validateId(id);
    const actor = validateId(idActor);
    const datosValidados = validateEdicion(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const viaje = await viajeModel.findByIdForUpdate(client, idViaje);
        if (!viaje) {
            throw createHttpError("Viaje no encontrado", 404);
        }
        if (viaje.estado !== "REGISTRADO") {
            throw createHttpError("No se puede editar un viaje anulado", 409);
        }
        if (viaje.version !== datosValidados.version) {
            throw createHttpError("El viaje fue modificado; vuelva a consultarlo antes de editar", 409);
        }
        const detalles = await detalleModel.findByViajeForUpdate(client, idViaje);
        if (detalles.some((detalle) => detalle.id_liquidacion !== null)) {
            throw createHttpError("No se puede editar un viaje con entregas asociadas a una liquidación vigente", 409);
        }
        const anterior = await consultar(client, idViaje);
        validarPertenencia(datosValidados.detalles, detalles, "id_detalle_viaje");
        validarPertenencia(datosValidados.tramos, anterior.tramos, "id_tramo_viaje");
        const eliminados = detalles.filter((detalle) => !datosValidados.detalles.some(
            (nuevo) => nuevo.id_detalle_viaje === detalle.id_detalle_viaje
        ));
        for (const detalle of eliminados) {
            if (await detalleModel.hasHistorialLiquidacion(client, detalle.id_detalle_viaje)) {
                throw createHttpError("Conserve el ID de la entrega con historial de liquidación; puede corregirla pero no eliminarla", 409);
            }
        }
        if (viaje.id_vehiculo !== datosValidados.id_vehiculo && await viajeModel.hasGastos(client, idViaje)) {
            throw createHttpError("No se puede cambiar el vehículo de un viaje con gastos vinculados", 409);
        }
        const { recorrido, tarifas } = await preparacionService.preparar(client, datosValidados, anterior.tramos);
        // Se comprueba el estado final: fecha y tarifa pueden cambiar juntas de vigencia.
        await client.query("SET CONSTRAINTS viaje_validar_fecha, detalle_viaje_validar_tarifa DEFERRED");
        await viajeModel.update(client, idViaje, datosValidados);
        for (const detalle of eliminados) {
            await detalleModel.remove(client, detalle.id_detalle_viaje);
        }
        for (const detalle of datosValidados.detalles) {
            const tarifa = tarifas.get(`${detalle.id_gasolinera}:${detalle.id_terminal}`);
            if (detalle.id_detalle_viaje === null) {
                await detalleModel.create(client, idViaje, detalle, tarifa);
            } else {
                await detalleModel.update(client, detalle.id_detalle_viaje, detalle, tarifa);
            }
        }
        for (const tramo of anterior.tramos) {
            if (!recorrido.some((nuevo) => nuevo.id_tramo_viaje === tramo.id_tramo_viaje)) {
                await tramoModel.remove(client, tramo.id_tramo_viaje);
            }
        }
        for (const tramo of recorrido) {
            if (tramo.id_tramo_viaje === null) {
                await tramoModel.create(client, idViaje, tramo);
            } else {
                await tramoModel.update(client, tramo.id_tramo_viaje, tramo);
            }
        }
        // Evita dejar asignaciones del chofer/día anterior al mover el viaje.
        await costoModel.removeByViaje(client, idViaje);
        const dias = new Map();
        for (const registro of [viaje, datosValidados]) {
            const fecha = registro.fecha_inicio.slice(0, 10);
            dias.set(`${registro.id_chofer}:${fecha}`, { id_chofer: registro.id_chofer, fecha });
        }
        for (const dia of dias.values()) {
            await remuneracionModel.recalcular(client, dia.id_chofer, dia.fecha);
            await viaticoService.recalcular(client, dia.id_chofer, dia.fecha);
        }
        await costoService.crearAutomaticos(client, idViaje, datosValidados.fecha_inicio.slice(0, 10));
        // Fuerza todas las validaciones diferidas antes de capturar el resultado.
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        const resultado = await consultar(client, idViaje);
        await historialModel.create(client, {
            id_viaje: idViaje, id_actor: actor, motivo: datosValidados.motivo, anterior, posterior: resultado
        });
        await client.query("COMMIT");
        return resultado;
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

const getHistorialViaje = async (id) => {
    const idViaje = validateId(id);
    if (!await viajeModel.findById(idViaje)) {
        throw createHttpError("Viaje no encontrado", 404);
    }
    return historialModel.findByViaje(idViaje);
};

module.exports = { updateViaje, getHistorialViaje };
