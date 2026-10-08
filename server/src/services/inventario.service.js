const pool = require("../config/database");
const productoModel = require("../models/producto.model");
const movimientoInventarioModel = require("../models/movimiento_inventario.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateAjuste, validateFiltros } = require("../utils/validators/inventario.validators");

const getStock = async () => {
    return await productoModel.findStock();
};

const getStockByProducto = async (id) => {
    const productos = await productoModel.findStock(validateId(id));
    if (!productos.length) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
    }
    return productos[0];
};

const getBajoStock = async () => {
    return await productoModel.findStock(null, true);
};

const getMovimientos = async (query) => {
    const filtros = validateFiltros(query);
    if (filtros.id_producto !== null && !await productoModel.findById(filtros.id_producto)) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
    }
    return await movimientoInventarioModel.findAll(filtros);
};

const createAjuste = async (data) => {
    const datosValidados = validateAjuste(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        if (!await productoModel.findByIdForUpdate(client, datosValidados.id_producto)) {
            const error = new Error("Producto no encontrado");
            error.status = 404;
            throw error;
        }
        const movimiento = await movimientoInventarioModel.createAjuste(client, datosValidados);
        if (!movimiento) {
            const error = new Error("El ajuste dejaría el inventario con stock negativo");
            error.status = 409;
            throw error;
        }
        const disponibilidad = await movimientoInventarioModel.getDisponibilidad(client, datosValidados.id_producto, "0");
        await client.query("COMMIT");
        return { ...movimiento, stock_actual: disponibilidad.stock };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getStock,
    getStockByProducto,
    getBajoStock,
    getMovimientos,
    createAjuste
};
