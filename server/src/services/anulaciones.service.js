const pool = require("../config/database");
const recepcionModel = require("../models/recepcion_compra.model");
const mantenimientoModel = require("../models/mantenimiento.model");
const movimientoModel = require("../models/movimiento_inventario.model");
const productoModel = require("../models/producto.model");
const facturaModel = require("../models/factura_proveedor.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateMotivo } = require("../utils/validators/anulacion.validators");

const errorOperacion = (mensaje, status = 409) => {
    const error = new Error(mensaje);
    error.status = status;
    throw error;
};

const ejecutar = async (tipo, id, data) => {
    id = validateId(id);
    const motivo = validateMotivo(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const model = tipo === "recepcion" ? recepcionModel : tipo === "mantenimiento" ? mantenimientoModel : movimientoModel;
        const original = await model.findForUpdate(client, id);
        if (!original) errorOperacion("Registro no encontrado", 404);
        if (["ANULADA", "ANULADO"].includes(original.estado)) errorOperacion("El registro ya está anulado");
        let movimientos;
        if (tipo === "recepcion") {
            // Coordina los pendientes con el registro de nuevas entregas.
            await facturaModel.findByIdForUpdate(client, original.id_factura_proveedor);
            movimientos = await movimientoModel.findByRecepcion(client, id);
        } else if (tipo === "mantenimiento") {
            movimientos = await movimientoModel.findByMantenimiento(client, id);
        } else {
            if (original.tipo_movimiento !== "AJUSTE" || original.id_movimiento_revertido
                || original.id_detalle_mantenimiento || original.id_detalle_recepcion_compra) {
                errorOperacion("Solo se pueden revertir ajustes manuales originales");
            }
            movimientos = [original];
        }
        const productos = [...new Set(movimientos.map(m => m.id_producto))].sort((a, b) => a - b);
        for (const producto of productos) await productoModel.findByIdForUpdate(client, producto);
        const reversiones = [];
        for (const movimiento of movimientos) {
            if (await movimientoModel.hasReversion(client, movimiento.id_movimiento)) errorOperacion("El movimiento ya fue revertido");
            const inverso = await movimientoModel.createReversion(client, movimiento.id_movimiento, motivo);
            if (!inverso) errorOperacion("Stock insuficiente para revertir el movimiento");
            reversiones.push(inverso);
        }
        const registro = tipo === "ajuste" ? original : await model.anular(client, id, motivo);
        await client.query("COMMIT");
        return { ...registro, reversiones };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    anularRecepcion: (id, data) => ejecutar("recepcion", id, data),
    anularMantenimiento: (id, data) => ejecutar("mantenimiento", id, data),
    revertirAjuste: (id, data) => ejecutar("ajuste", id, data)
};
