const { createRecepcionEnTransaccion } = require("./recepciones_compra.service");
const detalleFacturaProveedorModel = require("../models/detalle_factura_proveedor.model");
const proveedorModel = require("../models/proveedor.model");
const recepcionCompraModel = require("../models/recepcion_compra.model");
const productoModel = require("../models/producto.model");
const pool = require("../config/database");
const facturaProveedorModel = require("../models/factura_proveedor.model");
const { validateData } = require("../utils/validators/factura_proveedor.validators");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");
const { createHttpError } = require("../utils/errors/http.error");

const getFacturasProveedor = async () => {
    return await facturaProveedorModel.findAll();
};

const getFacturaProveedorById = async (id) => {
    const factura = await facturaProveedorModel.findById(validateId(id));
    if (!factura) {
        throw createHttpError("Factura de proveedor no encontrada", 404);
    }
    return factura;
};

const createFacturaProveedor = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const proveedor = await proveedorModel.findByIdForShare(
            client,
            datosValidados.id_proveedor
        );
        if (!proveedor) {
            throw createHttpError("El proveedor indicado no existe", 400);
        }
        // Bloqueo en orden estable para evitar interbloqueos entre compras.
        const productos = [
            ...new Set(
                datosValidados.detalles
                    .filter((d) => {
                        return d.id_producto !== null;
                    })
                    .map((d) => {
                        return d.id_producto;
                    })
            )
        ].sort((a, b) => {
            return a - b;
        });
        for (const id of productos) {
            if (!(await productoModel.findByIdForUpdate(client, id))) {
                throw createHttpError("El producto indicado no existe", 400);
            }
        }
        const factura = await facturaProveedorModel.create(client, datosValidados);
        const detalles = [];
        for (const detalle of datosValidados.detalles) {
            detalles.push(
                await detalleFacturaProveedorModel.create(
                    client,
                    factura.id_factura_proveedor,
                    detalle
                )
            );
        }
        const resultado = await facturaProveedorModel.updateTotales(
            client,
            factura.id_factura_proveedor
        );
        let recepcion = null;
        if (datosValidados.recepcion_inicial) {
            recepcion = await createRecepcionEnTransaccion(client, {
                id_factura_proveedor: factura.id_factura_proveedor,
                fecha_recepcion: datosValidados.recepcion_inicial.fecha_recepcion,
                detalles: datosValidados.recepcion_inicial.detalles.map((recibido) => {
                    return {
                        id_detalle_factura_proveedor:
                            detalles[recibido.numero_detalle - 1].id_detalle_factura_proveedor,
                        cantidad_recibida: recibido.cantidad_recibida
                    };
                })
            });
        }
        const resumen = await facturaProveedorModel.findById(factura.id_factura_proveedor, client);
        await client.query("COMMIT");
        return {
            ...resultado,
            total_pagado: resumen.total_pagado,
            saldo_pendiente: resumen.saldo_pendiente,
            estado_pago: resumen.estado_pago,
            vencida: resumen.vencida,
            detalles,
            recepcion_inicial: recepcion
        };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") {
            throw createHttpError(
                "Los importes calculados exceden el límite monetario permitido",
                400
            );
        }
        throw error;
    } finally {
        client.release();
    }
};

const getRecepciones = async (id) => {
    const factura = await getFacturaProveedorById(id);
    return await recepcionCompraModel.findByFactura(factura.id_factura_proveedor);
};

const getPendientesRecepcion = async (id) => {
    const factura = await getFacturaProveedorById(id);
    return await detalleFacturaProveedorModel.findPendientesByFactura(factura.id_factura_proveedor);
};

const anularFacturaProveedor = async (id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Pagos y recepciones también bloquean esta fila antes de registrarse.
        const factura = await facturaProveedorModel.findByIdForUpdate(client, id);
        if (!factura) {
            throw createHttpError("Factura de proveedor no encontrada", 404);
        }
        if (factura.estado === "ANULADA") {
            throw createHttpError("La factura ya está anulada", 409);
        }
        const dependencias = await facturaProveedorModel.getDependenciasVigentes(client, id);
        if (dependencias.tiene_pagos || dependencias.tiene_recepciones) {
            const pendientes = [];
            if (dependencias.tiene_pagos) {
                pendientes.push("pagos");
            }
            if (dependencias.tiene_recepciones) {
                pendientes.push("recepciones");
            }
            throw createHttpError(
                `Debes anular primero los siguientes registros vigentes de la factura: ${pendientes.join(" y ")}`,
                409
            );
        }
        await facturaProveedorModel.anular(client, id, motivo);
        const resultado = await facturaProveedorModel.findById(id, client);
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
    anularFacturaProveedor,
    getRecepciones,
    getPendientesRecepcion,
    getFacturasProveedor,
    getFacturaProveedorById,
    createFacturaProveedor
};
