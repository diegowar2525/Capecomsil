const pool = require('../config/database');
const { lock } = require('../utils/transaction.lock');
const { createHttpError } = require('../utils/errors/http.error');
const { validateId } = require('../utils/validators/common.validators');
const { validateData } = require('../utils/validators/mantenimiento.validators');
const mantenimientoModel = require('../models/mantenimiento.model');
const edicionModel = require('../models/mantenimiento_edicion.model');
const vehiculoModel = require('../models/vehiculo.model');
const proveedorModel = require('../models/proveedor.model');
const gastoModel = require('../models/gasto.model');
const cumplimientoModel = require('../models/cumplimiento_plan_mantenimiento.model');
const { getMantenimientoById } = require('./mantenimientos.service');
const { registrarDesembolso } = require('./mantenimiento_facturacion.service');

const updateMantenimiento = async (id,data,idActor) => {
    id = validateId(id);
    const actor = validateId(idActor);
    const version = validateId(data?.version);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await lock(client);
        const actual = await mantenimientoModel.findByIdForUpdate(client,id);
        if (!actual) throw createHttpError('Mantenimiento no encontrado',404);
        if (actual.estado !== 'REGISTRADO') throw createHttpError('No se puede editar un trabajo anulado',409);
        if (actual.version !== version) throw createHttpError('El trabajo cambió; vuelva a consultarlo antes de editar',409);
        if (data.factura || (data.id_factura_proveedor != null && Number(data.id_factura_proveedor) !== actual.id_factura_proveedor)
            || (data.modalidad_pago && data.modalidad_pago !== (actual.id_factura_proveedor ? 'EXISTENTE' : 'DIRECTO'))) {
            throw createHttpError('La factura y vía de pago se conservan al editar el trabajo',409);
        }
        const datos = validateData({...data,id_factura_proveedor:actual.id_factura_proveedor});
        if (!await vehiculoModel.findByIdForShare(client,datos.id_vehiculo)) {
            throw createHttpError('El vehículo indicado no existe',400);
        }
        if (datos.id_proveedor && !await proveedorModel.findByIdForShare(client,datos.id_proveedor)) {
            throw createHttpError('El proveedor indicado no existe',400);
        }
        const anterior = await getMantenimientoById(id,client);
        if (anterior.cumplimientos.length && (datos.clase !== 'PREVENTIVO' || !datos.fecha_fin || datos.id_vehiculo !== actual.id_vehiculo)) {
            throw createHttpError('Con planes cumplidos conserve la clase preventiva, el vehículo y la finalización',409);
        }
        if (actual.id_factura_proveedor && (datos.id_proveedor !== actual.id_proveedor || Number(datos.monto) !== Number(actual.monto))) {
            throw createHttpError('El proveedor y el importe deben conservar los de la factura vinculada',409);
        }
        const pagos = anterior.pagos.filter(p => p.estado === 'REGISTRADO');
        if (!actual.pago_directo_automatico && pagos.length && (
            datos.id_vehiculo !== actual.id_vehiculo || datos.id_proveedor !== actual.id_proveedor
            || Number(datos.monto) !== Number(actual.monto) || datos.fecha_inicio.slice(0,10) !== actual.fecha_inicio.slice(0,10))) {
            throw createHttpError('El trabajo conserva pagos anteriores; no cambie sus referencias, fecha o importe',409);
        }
        if (actual.pago_directo_automatico) {
            for (const pago of pagos) await gastoModel.anular(client,pago.id_gasto,'Sustituido por edición del mantenimiento');
        }
        await edicionModel.update(client,id,datos);
        // Los materiales históricos se conservan; el inventario se ajusta manualmente.
        for (const plan of datos.planes_cumplidos) {
            if (!anterior.cumplimientos.some(c=>c.id_plan_mantenimiento_vehiculo===plan)) await cumplimientoModel.create(client,id,plan);
        }
        await edicionModel.recalcularCumplimientos(client,id);
        if (actual.pago_directo_automatico) await registrarDesembolso(client,{...datos,id_mantenimiento:id},datos.numero_comprobante);
        await client.query('SET CONSTRAINTS ALL IMMEDIATE');
        const posterior = await getMantenimientoById(id,client);
        await edicionModel.registrarHistorial(client,id,actor,anterior,posterior);
        await client.query('COMMIT');
        return posterior;
    } catch(error) {
        await client.query('ROLLBACK');
        throw error;
    } finally { client.release(); }
};
const getHistorial = async id => {
    id = validateId(id);
    await getMantenimientoById(id);
    return edicionModel.historial(id);
};
module.exports = { updateMantenimiento,getHistorial };
