const pool = require("../config/database");
const mantenimientoModel = require("../models/mantenimiento.model");
const pagoMantenimientoModel = require("../models/pago_mantenimiento.model");
const gastoModel = require("../models/gasto.model");
const { lock } = require("../utils/transaction.lock");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/pago_mantenimiento.validators");
const { createHttpError } = require("../utils/errors/http.error");

const createPago = async (id, data) => {
    id = validateId(id);
    const datosValidados = validateData(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await lock(client);
        const mantenimiento = await mantenimientoModel.findByIdForUpdate(client, id);
        if (!mantenimiento) {
            throw createHttpError("Mantenimiento no encontrado", 404);
        }
        if (mantenimiento.estado !== "REGISTRADO") {
            throw createHttpError("El trabajo está anulado", 409);
        }
        if (mantenimiento.pago_directo_automatico) {
            throw createHttpError("El pago se administra junto con el mantenimiento; edite el trabajo para corregirlo", 409);
        }
        if (mantenimiento.id_factura_proveedor) {
            throw createHttpError("Registre este pago desde Pagos a proveedores usando la factura vinculada", 409);
        }
        const creado = await gastoModel.create(client, { ...datosValidados,
            origen: "MANTENIMIENTO", id_mantenimiento: id, id_vehiculo: mantenimiento.id_vehiculo,
            id_proveedor: mantenimiento.id_proveedor, descripcion: "Pago directo al taller" });
        const gasto = await gastoModel.findById(creado.id_gasto, client);
        const resumen = await pagoMantenimientoModel.resumen(id, client);
        await client.query("COMMIT");
        return { ...gasto, ...resumen };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
module.exports = { createPago };
