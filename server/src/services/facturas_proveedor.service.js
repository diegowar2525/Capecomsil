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
        const proveedor = await facturaProveedorModel.findProveedor(client, datosValidados.id_proveedor);
        if (!proveedor) {
            const error = new Error("El proveedor indicado no existe");
            error.status = 400;
            throw error;
        }
        // Bloqueo en orden estable para evitar interbloqueos entre compras.
        const productos = [...new Set(datosValidados.detalles.filter(d => d.id_producto !== null).map(d => d.id_producto))].sort((a, b) => a - b);
        for (const id of productos) {
            if (!await facturaProveedorModel.findProducto(client, id)) {
                const error = new Error("El producto indicado no existe");
                error.status = 400;
                throw error;
            }
        }
        const factura = await facturaProveedorModel.create(client, datosValidados);
        const detalles = [];
        for (const detalle of datosValidados.detalles) {
            detalles.push(await facturaProveedorModel.createDetalle(client, factura.id_factura_proveedor, detalle));
        }
        const resultado = await facturaProveedorModel.updateTotales(client, factura.id_factura_proveedor);
        let recepcion = null;
        if (datosValidados.recepcion_inicial) {
            recepcion = await facturaProveedorModel.createRecepcion(client, factura.id_factura_proveedor, datosValidados.recepcion_inicial.fecha_recepcion);
            for (const recibido of datosValidados.recepcion_inicial.detalles) {
                const entrada = await facturaProveedorModel.createEntrada(client, recepcion, detalles[recibido.numero_detalle - 1], recibido.cantidad_recibida);
                if (!entrada) {
                    const error = new Error("La cantidad recibida supera la cantidad facturada");
                    error.status = 400;
                    throw error;
                }
            }
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

module.exports = {
    getFacturasProveedor,
    getFacturaProveedorById,
    createFacturaProveedor
};
