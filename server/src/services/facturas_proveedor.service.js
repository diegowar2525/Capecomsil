const { createRecepcionEnTransaccion } = require("./recepciones_compra.service");
const detalleFacturaProveedorModel = require("../models/detalle_factura_proveedor.model");
const proveedorModel = require("../models/proveedor.model");
const recepcionCompraModel = require("../models/recepcion_compra.model");
const productoModel = require("../models/producto.model");
const pool = require("../config/database");
const facturaProveedorModel = require("../models/factura_proveedor.model");
const { validateData } = require("../utils/validators/factura_proveedor.validators");
const { validateId } = require("../utils/validators/common.validators");

const getFacturasProveedor = async () => {
    return await facturaProveedorModel.findAll();
};

const getFacturaProveedorById = async (id) => {
    const factura = await facturaProveedorModel.findById(validateId(id));
    if (!factura) {
        const error = new Error("Factura de proveedor no encontrada");
        error.status = 404;
        throw error;
    }
    return factura;
};

const createFacturaProveedor = async (data) => {
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const proveedor = await proveedorModel.findByIdForShare(client, datosValidados.id_proveedor);
        if (!proveedor) {
            const error = new Error("El proveedor indicado no existe");
            error.status = 400;
            throw error;
        }
        // Bloqueo en orden estable para evitar interbloqueos entre compras.
        const productos = [...new Set(datosValidados.detalles.filter(d => d.id_producto !== null).map(d => d.id_producto))].sort((a, b) => a - b);
        for (const id of productos) {
            if (!await productoModel.findByIdForUpdate(client, id)) {
                const error = new Error("El producto indicado no existe");
                error.status = 400;
                throw error;
            }
        }
        const factura = await facturaProveedorModel.create(client, datosValidados);
        const detalles = [];
        for (const detalle of datosValidados.detalles) {
            detalles.push(await detalleFacturaProveedorModel.create(client, factura.id_factura_proveedor, detalle));
        }
        const resultado = await facturaProveedorModel.updateTotales(client, factura.id_factura_proveedor);
        let recepcion = null;
        if (datosValidados.recepcion_inicial) {
            recepcion = await createRecepcionEnTransaccion(client, {
                id_factura_proveedor: factura.id_factura_proveedor,
                fecha_recepcion: datosValidados.recepcion_inicial.fecha_recepcion,
                detalles: datosValidados.recepcion_inicial.detalles.map((recibido) => ({
                    id_detalle_factura_proveedor: detalles[recibido.numero_detalle - 1].id_detalle_factura_proveedor,
                    cantidad_recibida: recibido.cantidad_recibida
                }))
            });
        }
        await client.query("COMMIT");
        return { ...resultado, detalles, recepcion_inicial: recepcion };
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "22003") {
            const errorImporte = new Error("Los importes calculados exceden el límite monetario permitido");
            errorImporte.status = 400;
            throw errorImporte;
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

module.exports = {
    getRecepciones,
    getPendientesRecepcion,
    getFacturasProveedor,
    getFacturaProveedorById,
    createFacturaProveedor
};
