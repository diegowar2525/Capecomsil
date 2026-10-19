const pool = require("../config/database");
const { lock } = require("../utils/transaction.lock");
const { createHttpError } = require("../utils/errors/http.error");
const { validateFinalizacion } = require("../utils/validators/mantenimiento.validators");
const mantenimientoModel = require("../models/mantenimiento.model");
const cumplimientoModel = require("../models/cumplimiento_plan_mantenimiento.model");
const { validatePlanesCumplidos } = require("../utils/validators/plan_mantenimiento.validators");
const detalleMantenimientoModel = require("../models/detalle_mantenimiento.model");
const movimientoInventarioModel = require("../models/movimiento_inventario.model");
const vehiculoModel = require("../models/vehiculo.model");
const proveedorModel = require("../models/proveedor.model");
const productoModel = require("../models/producto.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/mantenimiento.validators");

const getMantenimientos = async () => {
    return await mantenimientoModel.findAll();
};

const getMantenimientoById = async (id) => {
    const idNumerico = validateId(id);
    const mantenimiento = await mantenimientoModel.findById(idNumerico);
    if (!mantenimiento) {
        throw createHttpError("Mantenimiento no encontrado", 404);
    }
    const detalles = await detalleMantenimientoModel.findByMantenimiento(idNumerico);
    return {
        ...mantenimiento,
        detalles,
        cumplimientos: await cumplimientoModel.findByMantenimiento(idNumerico)
    };
};

const createMantenimiento = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        if (!(await vehiculoModel.findByIdForShare(client, datosValidados.id_vehiculo))) {
            throw createHttpError("El vehículo indicado no existe", 400);
        }
        if (
            datosValidados.id_proveedor !== null &&
            !(await proveedorModel.findByIdForShare(client, datosValidados.id_proveedor))
        ) {
            throw createHttpError("El proveedor indicado no existe", 400);
        }

        // El mismo orden de bloqueo que en compras evita interbloqueos.
        const ordenados = datosValidados.detalles
            .filter((d) => {
                return d.origen_producto === "INVENTARIO";
            })
            .sort((a, b) => {
                return a.id_producto - b.id_producto;
            });
        for (const detalle of ordenados) {
            if (!(await productoModel.findByIdForUpdate(client, detalle.id_producto))) {
                throw createHttpError("El producto indicado no existe", 400);
            }
            const disponibilidad = await movimientoInventarioModel.getDisponibilidad(
                client,
                detalle.id_producto,
                detalle.cantidad
            );
            if (!disponibilidad.suficiente) {
                throw createHttpError(
                    `Stock insuficiente para el producto ${detalle.id_producto}. Disponible: ${disponibilidad.stock}`,
                    409
                );
            }
        }
        const mantenimiento = await mantenimientoModel.create(client, datosValidados);
        const detalles = [];
        for (const detalle of datosValidados.detalles) {
            const creado = await detalleMantenimientoModel.create(
                client,
                mantenimiento.id_mantenimiento,
                detalle
            );
            if (detalle.origen_producto === "INVENTARIO") {
                await movimientoInventarioModel.createSalida(client, {
                    id_producto: detalle.id_producto,
                    fecha: datosValidados.fecha_inicio,
                    cantidad: detalle.cantidad,
                    id_detalle_mantenimiento: creado.id_detalle_mantenimiento
                });
            }
            detalles.push(creado);
        }
        for (const plan of datosValidados.planes_cumplidos) {
            await cumplimientoModel.create(client, mantenimiento.id_mantenimiento, plan);
        }
        const cumplimientos = await cumplimientoModel.findByMantenimiento(
            mantenimiento.id_mantenimiento,
            client
        );
        await client.query("COMMIT");
        return {
            ...mantenimiento,
            detalles,
            cumplimientos
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const finalizarMantenimiento = async (id, data) => {
    id = validateId(id);
    const fecha = validateFinalizacion(data);
    const planes = validatePlanesCumplidos(data.planes_cumplidos);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const actual = await mantenimientoModel.findByIdForUpdate(client, id);
        if (!actual) {
            throw createHttpError("Mantenimiento no encontrado", 404);
        }
        if (actual.estado === "ANULADO") {
            throw createHttpError("El mantenimiento está anulado", 409);
        }
        if (actual.fecha_fin !== null) {
            throw createHttpError("El mantenimiento ya está finalizado", 409);
        }
        if (fecha <= actual.fecha_inicio) {
            throw createHttpError("El fin debe ser posterior al inicio", 400);
        }
        const resultado = await mantenimientoModel.finalizar(client, id, fecha);
        for (const plan of planes) {
            await cumplimientoModel.create(client, id, plan);
        }
        const cumplimientos = await cumplimientoModel.findByMantenimiento(id, client);
        await client.query("COMMIT");
        return {
            ...resultado,
            cumplimientos
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const registrarCumplimientos = async (id, data) => {
    id = validateId(id);
    const planes = validatePlanesCumplidos(data?.planes_cumplidos);
    if (!planes.length) {
        throw createHttpError("Indique al menos un plan cumplido", 400);
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const mantenimiento = await mantenimientoModel.findByIdForUpdate(client, id);
        if (!mantenimiento) {
            throw createHttpError("Mantenimiento no encontrado", 404);
        }
        if (mantenimiento.estado !== "REGISTRADO" || !mantenimiento.fecha_fin) {
            throw createHttpError("El mantenimiento debe estar finalizado y no anulado", 409);
        }
        for (const plan of planes) {
            await cumplimientoModel.create(client, id, plan);
        }
        const resultado = await cumplimientoModel.findByMantenimiento(id, client);
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
    registrarCumplimientos,
    finalizarMantenimiento,
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
};
