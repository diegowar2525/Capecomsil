const pool = require("../config/database");
const pagoModel = require("../models/pago_proveedor.model");
const facturaModel = require("../models/factura_proveedor.model");
const proveedorModel = require("../models/proveedor.model");
const { validateData, validateFiltros } = require("../utils/validators/pago_proveedor.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const getPagos = async (query) => {
    return await pagoModel.findAll(validateFiltros(query));
};

const getPagoById = async (id) => {
    const pago = await pagoModel.findById(validateId(id));
    if (!pago) throw createHttpError("Pago de proveedor no encontrado", 404);
    return pago;
};

const getPagosByFactura = async (id, query) => {
    id = validateId(id);
    if (!await facturaModel.findById(id)) throw createHttpError("Factura de proveedor no encontrada", 404);
    return await getPagos({ ...query, id_factura_proveedor: id });
};

const getCuentasPorPagar = async (id) => {
    id = validateId(id);
    if (!await proveedorModel.findById(id)) throw createHttpError("Proveedor no encontrado", 404);
    return await facturaModel.findCuentasPorPagar(id);
};

const createPago = async (data) => {
    const validado = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const factura = await facturaModel.findByIdForUpdate(client, validado.id_factura_proveedor);
        if (!factura) throw createHttpError("Factura de proveedor no encontrada", 404);
        if (factura.estado === "ANULADA") throw createHttpError("No se puede pagar una factura anulada");
        const pago = await pagoModel.create(client, validado);
        if (!pago) throw createHttpError("El monto supera el saldo pendiente de la factura");
        const resumen = await facturaModel.findById(factura.id_factura_proveedor, client);
        await client.query("COMMIT");
        return { ...pago, total_pagado: resumen.total_pagado, saldo_pendiente: resumen.saldo_pendiente, estado_pago: resumen.estado_pago };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const anularPago = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const original = await pagoModel.findById(id, client);
        if (!original) throw createHttpError("Pago de proveedor no encontrado", 404);
        // Mismo bloqueo que en altas: serializa pagos y anulaciones de la factura.
        await facturaModel.findByIdForUpdate(client, original.id_factura_proveedor);
        const pago = await pagoModel.anular(client, id, motivo);
        if (!pago) throw createHttpError("El pago ya está anulado");
        const resumen = await facturaModel.findById(original.id_factura_proveedor, client);
        await client.query("COMMIT");
        return { ...pago, total_pagado: resumen.total_pagado, saldo_pendiente: resumen.saldo_pendiente, estado_pago: resumen.estado_pago };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { getPagos, getPagoById, getPagosByFactura, getCuentasPorPagar, createPago, anularPago };
