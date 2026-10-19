const { createHttpError } = require("../utils/errors/http.error");
const pool = require("../config/database");
const facturaProveedorModel = require("../models/factura_proveedor.model");
const detalleFacturaProveedorModel = require("../models/detalle_factura_proveedor.model");
const recepcionCompraModel = require("../models/recepcion_compra.model");
const detalleRecepcionCompraModel = require("../models/detalle_recepcion_compra.model");
const movimientoInventarioModel = require("../models/movimiento_inventario.model");
const productoModel = require("../models/producto.model");
const { validateData } = require("../utils/validators/recepcion_compra.validators");

// No abre ni cierra transacciones: el llamador conserva el control del client.
// Se comparte entre la recepción inicial de una factura y las entregas posteriores.
const createRecepcionEnTransaccion = async (client, data) => {
    const datosValidados = validateData(data);
    const factura = await facturaProveedorModel.findByIdForUpdate(
        client,
        datosValidados.id_factura_proveedor
    );
    if (!factura) {
        throw createHttpError("Factura de proveedor no encontrada", 404);
    }
    if (factura.estado === "ANULADA") {
        throw createHttpError("No se pueden registrar recepciones de una factura anulada", 409);
    }
    const lineas = [];
    for (const recibido of datosValidados.detalles) {
        const detalle = await detalleFacturaProveedorModel.findByIdForShare(
            client,
            recibido.id_detalle_factura_proveedor
        );
        if (!detalle || detalle.id_factura_proveedor !== datosValidados.id_factura_proveedor) {
            throw createHttpError("El detalle indicado no pertenece a la factura", 400);
        }
        if (detalle.tipo_concepto !== "PRODUCTO") {
            throw createHttpError("Solo los productos pueden recibirse en inventario", 400);
        }
        lineas.push({
            recibido,
            detalle
        });
    }
    const productos = [
        ...new Set(
            lineas.map((linea) => {
                return linea.detalle.id_producto;
            })
        )
    ].sort((a, b) => {
        return a - b;
    });
    for (const id of productos) {
        await productoModel.findByIdForUpdate(client, id);
    }
    const recepcion = await recepcionCompraModel.create(client, datosValidados);
    const detalles = [];
    for (const { recibido, detalle } of lineas) {
        const entrada = await detalleRecepcionCompraModel.create(
            client,
            recepcion.id_recepcion_compra,
            detalle,
            recibido.cantidad_recibida,
            recibido.observacion
        );
        if (!entrada) {
            throw createHttpError(
                "La cantidad recibida supera la cantidad pendiente de la factura",
                400
            );
        }
        await movimientoInventarioModel.createEntrada(client, {
            id_producto: detalle.id_producto,
            fecha: datosValidados.fecha_recepcion,
            cantidad: recibido.cantidad_recibida,
            id_detalle_recepcion_compra: entrada.id_detalle_recepcion_compra
        });
        detalles.push(entrada);
    }
    return {
        ...recepcion,
        detalles
    };
};

const createRecepcionCompra = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const recepcion = await createRecepcionEnTransaccion(client, datosValidados);
        await client.query("COMMIT");
        return recepcion;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createRecepcionCompra,
    createRecepcionEnTransaccion
};
