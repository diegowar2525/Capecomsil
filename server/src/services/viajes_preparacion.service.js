const peajeModel = require("../models/configuracion_peaje_trayecto.model");
const trayectoModel = require("../models/trayecto.model");
const vehiculoModel = require("../models/vehiculo.model");
const choferModel = require("../models/chofer.model");
const productoModel = require("../models/producto_transportado.model");
const tarifaModel = require("../models/tarifa.model");
const { validateRecorrido } = require("../utils/validators/tramo_viaje.validators");
const { createHttpError } = require("../utils/errors/http.error");

const preparar = async (client, datosValidados, anteriores = []) => {
    const trayectos = new Map();
    for (const id of [
        ...new Set(
            datosValidados.tramos.map((t) => {
                return t.id_trayecto;
            })
        )
    ].sort((a, b) => {
        return a - b;
    })) {
        const trayecto = await trayectoModel.findByIdForShare(client, id);
        if (!trayecto) {
            throw createHttpError("El trayecto indicado no existe", 400);
        }
        if (!trayecto.estado && !datosValidados.tramos.filter(t => t.id_trayecto === id).every(t =>
                anteriores.some(a => a.id_tramo_viaje === t.id_tramo_viaje && a.id_trayecto === id))) {
            throw createHttpError("El trayecto indicado está inactivo", 409);
        }
        const peaje = await peajeModel.findVigenteForShare(
            client,
            id,
            datosValidados.fecha_inicio.slice(0, 10)
        );
        if (!peaje) {
            throw createHttpError(
                `Falta configurar el peaje vigente del trayecto ${id}; indique cero si no tiene peaje`,
                409
            );
        }
        trayecto.id_configuracion_peaje_trayecto = peaje.id_configuracion_peaje_trayecto;
        trayecto.peaje_aplicado = peaje.importe;
        trayectos.set(id, trayecto);
    }
    const recorrido = datosValidados.tramos.map((t) => {
        return {
            ...trayectos.get(t.id_trayecto),
            ...t,
            kilometros: anteriores.find(a => a.id_tramo_viaje === t.id_tramo_viaje && a.id_trayecto === t.id_trayecto)?.kilometros ?? trayectos.get(t.id_trayecto).kilometros
        };
    });
    validateRecorrido(recorrido, datosValidados.detalles);
    if (!(await vehiculoModel.findByIdForShare(client, datosValidados.id_vehiculo))) {
        throw createHttpError("El vehículo no existe", 400);
    }
    if (!(await choferModel.findByIdForShare(client, datosValidados.id_chofer))) {
        throw createHttpError("El chofer no existe", 400);
    }
    const capacidad = await vehiculoModel.getCapacidadViaje(
        client,
        datosValidados.id_vehiculo,
        datosValidados.detalles.map((d) => {
            return d.galones;
        })
    );
    if (!capacidad.suficiente) {
        throw createHttpError(
            "Los galones del viaje exceden la capacidad máxima del vehículo",
            400
        );
    }
    const productos = [
        ...new Set(
            datosValidados.detalles.map((d) => {
                return d.id_producto_transportado;
            })
        )
    ].sort((a, b) => {
        return a - b;
    });
    for (const id of productos) {
        if (!(await productoModel.findByIdForShare(client, id))) {
            throw createHttpError("El producto transportado no existe", 400);
        }
    }
    const tarifas = new Map();
    // Orden estable para viajes que comparten varias tarifas.
    const ordenados = [...datosValidados.detalles].sort((a, b) => {
        return a.id_gasolinera - b.id_gasolinera || a.id_terminal - b.id_terminal;
    });
    for (const detalle of ordenados) {
        const clave = `${detalle.id_gasolinera}:${detalle.id_terminal}`;
        if (!tarifas.has(clave)) {
            const tarifa = await tarifaModel.findVigenteForUpdate(
                client,
                detalle.id_gasolinera,
                detalle.id_terminal,
                datosValidados.fecha_inicio.slice(0, 10)
            );
            if (!tarifa) {
                throw createHttpError(
                    `No existe tarifa vigente para gasolinera ${detalle.id_gasolinera} y terminal ${detalle.id_terminal}`,
                    409
                );
            }
            tarifas.set(clave, tarifa);
        }
    }
    return { recorrido, tarifas };
};

module.exports = { preparar };
