const facturacionService = require('./mantenimiento_facturacion.service');
const pagoMantenimientoModel = require("../models/pago_mantenimiento.model");
const pool = require("../config/database");
const { lock } = require("../utils/transaction.lock");
const { createHttpError } = require("../utils/errors/http.error");
const { validateFinalizacion } = require("../utils/validators/mantenimiento.validators");
const mantenimientoModel = require("../models/mantenimiento.model");
const cumplimientoModel = require("../models/cumplimiento_plan_mantenimiento.model");
const { validatePlanesCumplidos } = require("../utils/validators/plan_mantenimiento.validators");
const detalleMantenimientoModel = require("../models/detalle_mantenimiento.model");
const vehiculoModel = require("../models/vehiculo.model");
const proveedorModel = require("../models/proveedor.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/mantenimiento.validators");

const getMantenimientos = async () => {
    return await mantenimientoModel.findAll();
};

const getMantenimientoById = async (id, client = pool) => {
    const idNumerico = validateId(id);
    const mantenimiento = await mantenimientoModel.findById(idNumerico, client);
    if (!mantenimiento) {
        throw createHttpError("Mantenimiento no encontrado", 404);
    }
    const detalles = await detalleMantenimientoModel.findByMantenimiento(idNumerico, client);
    return {
        ...mantenimiento,
        detalles,
        pagos: await pagoMantenimientoModel.findByMantenimiento(idNumerico, client),
        ...await pagoMantenimientoModel.resumen(idNumerico, client),
        cumplimientos: await cumplimientoModel.findByMantenimiento(idNumerico, client)
    };
};

const createMantenimiento = async (data) => {

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const datosValidados = validateData(await facturacionService.prepararFactura(client, data));
        if (!(await vehiculoModel.findByIdForShare(client, datosValidados.id_vehiculo))) {
            throw createHttpError("El vehículo indicado no existe", 400);
        }
        if (
            datosValidados.id_proveedor !== null &&
            !(await proveedorModel.findByIdForShare(client, datosValidados.id_proveedor))
        ) {
            throw createHttpError("El proveedor indicado no existe", 400);
        }

        const mantenimiento = await mantenimientoModel.create(client, datosValidados);
        const detalles = [];
        for (const plan of datosValidados.planes_cumplidos) {
            await cumplimientoModel.create(client, mantenimiento.id_mantenimiento, plan);
        }
        const cumplimientos = await cumplimientoModel.findByMantenimiento(
            mantenimiento.id_mantenimiento,
            client
        );
        if (!mantenimiento.id_factura_proveedor) {
            await facturacionService.crearPagoDirecto(client, mantenimiento, datosValidados.numero_comprobante);
        }
        const actualizado = await getMantenimientoById(mantenimiento.id_mantenimiento, client);
        await client.query("COMMIT");
        return {
            ...actualizado,
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
        if (planes.length && actual.clase !== "PREVENTIVO") {
            throw createHttpError("Solo los trabajos preventivos pueden cumplir planes de mantenimiento", 409);
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
        if (mantenimiento.clase !== "PREVENTIVO") {
            throw createHttpError("Solo los trabajos preventivos pueden cumplir planes de mantenimiento", 409);
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
