const pool = require("../config/database");
const liquidacionModel = require("../models/liquidacion.model");
const detalleLiquidacionModel = require("../models/detalle_liquidacion.model");
const gasolineraModel = require("../models/gasolinera.model");
const { lock } = require("../utils/transaction.lock");
const { validateId } = require("../utils/validators/common.validators");
const { validateCreacion, validateEdicion, validateDisponibles, validateFiltros, validateTransicion, validateAnulacion } = require("../utils/validators/liquidacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const exigirBorrador = (liquidacion) => {
    if (!liquidacion) {
        throw createHttpError("Liquidación no encontrada", 404);
    }
    if (liquidacion.estado !== "BORRADOR") {
        throw createHttpError("Solo se pueden modificar liquidaciones en borrador", 409);
    }
};

const validarGasolinera = async (client, id) => {
    if (!await gasolineraModel.findById(id, client)) {
        throw createHttpError("Gasolinera no encontrada", 404);
    }
};

const consultarCompleta = async (client, id) => {
    const liquidacion = await liquidacionModel.findById(id, client);
    if (!liquidacion) {
        throw createHttpError("Liquidación no encontrada", 404);
    }
    return { ...liquidacion, detalles: await detalleLiquidacionModel.findByLiquidacion(id, client) };
};

const findAll = async (query) => {
    return liquidacionModel.findAll(validateFiltros(query));
};

const findById = async (id) => {
    const idLiquidacion = validateId(id);
    const client = await pool.connect();
    try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        const resultado = await consultarCompleta(client, idLiquidacion);
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const findDisponibles = async (query) => {
    const datosValidados = validateDisponibles(query);
    const client = await pool.connect();
    try {
        await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
        await validarGasolinera(client, datosValidados.id_gasolinera);
        if (datosValidados.id_liquidacion !== null) {
            exigirBorrador(await liquidacionModel.findById(datosValidados.id_liquidacion, client));
        }
        const disponibles = await detalleLiquidacionModel.findDisponibles(datosValidados, client);
        const resultado = {
            cantidad: disponibles[0]?.cantidad_disponible ?? 0,
            total_galones: disponibles[0]?.galones_disponibles ?? "0.00",
            valor_transporte: disponibles[0]?.transporte_disponible ?? "0.00",
            entregas: disponibles.map(({ cantidad_disponible, galones_disponibles, transporte_disponible, ...entrega }) => entrega)
        };
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const guardarBorrador = async (id, datosValidados) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Mismo candado que viajes y triggers de liquidación; siempre antes de bloquear filas.
        await lock(client);
        let anteriores = [];
        if (id !== null) {
            const liquidacion = await liquidacionModel.findByIdForUpdate(client, id);
            exigirBorrador(liquidacion);
            if (liquidacion.version !== datosValidados.version) {
                throw createHttpError("La liquidación fue modificada; vuelva a consultarla antes de editar", 409);
            }
            if (liquidacion.retencion !== "0.00" || liquidacion.recargo !== "0.00") {
                throw createHttpError("Este borrador tiene ajustes previos; su edición requiere la gestión de retenciones y recargos", 409);
            }
            anteriores = await detalleLiquidacionModel.findByLiquidacion(id, client);
        }
        await validarGasolinera(client, datosValidados.id_gasolinera);
        const disponibles = await detalleLiquidacionModel.findDisponibles({ ...datosValidados, id_liquidacion: id }, client);
        const idsDisponibles = new Set(disponibles.map((entrega) => entrega.id_detalle_viaje));
        const seleccionados = datosValidados.id_detalles_viaje ?? [...idsDisponibles].sort((a, b) => a - b);
        if (id === null && seleccionados.length === 0) {
            throw createHttpError("No hay entregas disponibles para generar el borrador", 409);
        }
        if (seleccionados.some((idEntrega) => !idsDisponibles.has(idEntrega))) {
            throw createHttpError("Una o más entregas no están disponibles para esa gasolinera y período", 409);
        }
        await detalleLiquidacionModel.lockEntregas(client, seleccionados);
        let idLiquidacion = id;
        if (id === null) {
            idLiquidacion = (await liquidacionModel.create(client, datosValidados)).id_liquidacion;
        } else {
            // Quitar primero las entregas ajenas al nuevo período/gasolinera, sin borrar las conservadas.
            await detalleLiquidacionModel.removeNoSeleccionados(client, id, seleccionados);
            await liquidacionModel.update(client, id, datosValidados);
        }
        const idsAnteriores = new Set(anteriores.map((detalle) => detalle.id_detalle_viaje));
        for (const idEntrega of seleccionados) {
            if (!idsAnteriores.has(idEntrega)) {
                await detalleLiquidacionModel.create(client, idLiquidacion, idEntrega);
            }
        }
        await liquidacionModel.recalcularTotales(client, idLiquidacion);
        const resultado = await consultarCompleta(client, idLiquidacion);
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") {
            throw createHttpError("Los totales de la liquidación exceden el límite permitido", 400);
        }
        throw error;
    } finally {
        client.release();
    }
};

const create = async (data) => {
    return guardarBorrador(null, validateCreacion(data));
};

const update = async (id, data) => {
    return guardarBorrador(validateId(id), validateEdicion(data));
};

const ejecutarAccion = async (id, datosValidados, accion) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const liquidacion = await liquidacionModel.findByIdForUpdate(client, id);
        if (!liquidacion) {
            throw createHttpError("Liquidación no encontrada", 404);
        }
        if (liquidacion.version !== datosValidados.version) {
            throw createHttpError("La liquidación fue modificada; vuelva a consultarla", 409);
        }
        const estadosPermitidos = {
            enviar: ["BORRADOR"], confirmar: ["ENVIADA"],
            anular: ["BORRADOR", "ENVIADA", "CONFIRMADA"], eliminar: ["BORRADOR"]
        };
        if (!estadosPermitidos[accion].includes(liquidacion.estado)) {
            throw createHttpError("El estado de la liquidación no permite esta operación", 409);
        }
        if ((accion === "anular" || accion === "eliminar") && await liquidacionModel.tieneFactura(client, id)) {
            throw createHttpError("La liquidación tiene una factura asociada", 409);
        }
        if (accion === "enviar") {
            const detalles = await detalleLiquidacionModel.findByLiquidacion(id, client);
            if (detalles.length === 0) {
                throw createHttpError("No se puede enviar una liquidación sin entregas", 409);
            }
            if (liquidacion.retencion !== "0.00" || liquidacion.recargo !== "0.00") {
                throw createHttpError("La gestión de retenciones y recargos todavía no está habilitada", 409);
            }
        }
        let resultado;
        if (accion === "eliminar") {
            await detalleLiquidacionModel.removeNoSeleccionados(client, id, []);
            resultado = await liquidacionModel.remove(client, id);
        } else {
            const estados = { enviar: "ENVIADA", confirmar: "CONFIRMADA", anular: "ANULADA" };
            // El trigger verifica copias históricas y totales antes de permitir el envío.
            await liquidacionModel.cambiarEstado(client, id, estados[accion], datosValidados.motivo);
            resultado = await consultarCompleta(client, id);
        }
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const enviar = async (id, data) => {
    return ejecutarAccion(validateId(id), validateTransicion(data), "enviar");
};

const confirmar = async (id, data) => {
    return ejecutarAccion(validateId(id), validateTransicion(data), "confirmar");
};

const anular = async (id, data) => {
    return ejecutarAccion(validateId(id), validateAnulacion(data), "anular");
};

const remove = async (id, data) => {
    return ejecutarAccion(validateId(id), validateTransicion(data), "eliminar");
};

module.exports = { findAll, findById, findDisponibles, create, update, enviar, confirmar, anular, remove };
