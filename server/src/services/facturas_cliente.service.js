const pool = require("../config/database");
const facturaModel = require("../models/factura_cliente.model");
const cobroModel = require("../models/cobro_cliente.model");
const liquidacionModel = require("../models/liquidacion.model");
const detalleLiquidacionModel = require("../models/detalle_liquidacion.model");
const validators = require("../utils/validators/factura_cliente.validators");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");
const { lock } = require("../utils/transaction.lock");
const findAll = query => facturaModel.findAll(validators.validateFiltros(query));
const findById = async (id) => {
    id = validateId(id);
    const client = await pool.connect();
    try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        const factura = await facturaModel.findById(id, client);
        if (!factura) {
            throw createHttpError("Factura no encontrada", 404);
        }
        const liquidaciones = await facturaModel.findLiquidaciones(id, client);
        const entregas = [];
        for (const liquidacion of liquidaciones) {
            const detalles = await detalleLiquidacionModel.findByLiquidacion(liquidacion.id_liquidacion, client);
            entregas.push(...detalles.map(detalle => ({ ...detalle, nombre_gasolinera: liquidacion.nombre_gasolinera })));
        }
        const result = { ...factura, liquidaciones, entregas,
            recargos: liquidaciones.flatMap(l => (l.recargos ?? []).map(r => ({ ...r, nombre_gasolinera: l.nombre_gasolinera }))),
            cobros: await cobroModel.findByFactura(id, client) };
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
const create = async (data, usuario) => {
    const datosValidados = validators.validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        for (const idLiquidacion of [...datosValidados.id_liquidaciones].sort((a,b) => a-b)) {
            const liquidacion = await liquidacionModel.findByIdForUpdate(client, idLiquidacion);
            if (!liquidacion) throw createHttpError("Liquidación no encontrada", 404);
            if (liquidacion.estado !== "CONFIRMADA") throw createHttpError("Solo se facturan liquidaciones confirmadas", 409);
            if (liquidacion.id_empresa !== datosValidados.id_empresa) throw createHttpError("Todas las liquidaciones deben pertenecer a la empresa seleccionada", 409);
            if (await liquidacionModel.tieneFactura(client, idLiquidacion)) throw createHttpError("Una liquidación ya tiene una factura vigente", 409);
        }
        const created = await facturaModel.create(client, datosValidados, usuario);
        const result = await facturaModel.findById(created.id_factura, client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505") {
            throw createHttpError("El número de factura ya existe o la liquidación ya está facturada", 409);
        }
        throw error;
    } finally {
        client.release();
    }
};
const anular = async (id, data, usuario) => {
    id = validateId(id);
    const { motivo } = validators.validateAnulacion(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const factura = await facturaModel.findByIdForUpdate(client, id);
        if (!factura) {
            throw createHttpError("Factura no encontrada", 404);
        }
        if (factura.estado === "ANULADA") {
            throw createHttpError("La factura ya está anulada", 409);
        }
        if (Number(factura.importe_pagado_previo)>0) throw createHttpError("La factura tiene cobros previos reconocidos", 409);
        if ((await cobroModel.findByFactura(id, client)).some(p => p.estado === "REGISTRADO")) {
            throw createHttpError("Anule primero los cobros vigentes de esta factura", 409);
        }
        await facturaModel.anular(client, id, motivo, usuario);
        const result = await facturaModel.findById(id, client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
module.exports = { findAll, findById, create, anular };
