const pool = require("../config/database");
const mantenimientoModel = require("../models/mantenimiento.model");
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
        const error = new Error("Mantenimiento no encontrado");
        error.status = 404;
        throw error;
    }

    const detalles = await detalleMantenimientoModel.findByMantenimiento(idNumerico);
    return { ...mantenimiento, detalles };
};

const createMantenimiento = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        if (!await vehiculoModel.findByIdForShare(client, datosValidados.id_vehiculo)) {
            const error = new Error("El vehículo indicado no existe");
            error.status = 400;
            throw error;
        }
        if (datosValidados.id_proveedor !== null &&
            !await proveedorModel.findByIdForShare(client, datosValidados.id_proveedor)) {
            const error = new Error("El proveedor indicado no existe");
            error.status = 400;
            throw error;
        }

        // El mismo orden de bloqueo que en compras evita interbloqueos.
        const ordenados = datosValidados.detalles.filter(d => d.origen_producto === "INVENTARIO").sort((a, b) => a.id_producto - b.id_producto);
        for (const detalle of ordenados) {
            if (!await productoModel.findByIdForUpdate(client, detalle.id_producto)) {
                const error = new Error("El producto indicado no existe");
                error.status = 400;
                throw error;
            }
            const disponibilidad = await movimientoInventarioModel.getDisponibilidad(client, detalle.id_producto, detalle.cantidad);
            if (!disponibilidad.suficiente) {
                const error = new Error(`Stock insuficiente para el producto ${detalle.id_producto}. Disponible: ${disponibilidad.stock}`);
                error.status = 409;
                throw error;
            }
        }

        const mantenimiento = await mantenimientoModel.create(client, datosValidados);
        const detalles = [];
        for (const detalle of datosValidados.detalles) {
            const creado = await detalleMantenimientoModel.create(client, mantenimiento.id_mantenimiento, detalle);
            if (detalle.origen_producto === "INVENTARIO") await movimientoInventarioModel.createSalida(client, {
                id_producto: detalle.id_producto,
                fecha: datosValidados.fecha,
                cantidad: detalle.cantidad,
                id_detalle_mantenimiento: creado.id_detalle_mantenimiento
            });
            detalles.push(creado);
        }

        await client.query("COMMIT");
        return { ...mantenimiento, detalles };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getMantenimientos,
    getMantenimientoById,
    createMantenimiento
};
