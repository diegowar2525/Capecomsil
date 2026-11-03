const facturaModel = require('../models/factura_proveedor.model');
const gastoModel = require('../models/gasto.model');
const edicionModel = require('../models/mantenimiento_edicion.model');
const { createFacturaEnTransaccion } = require('./facturas_proveedor.service');
const { validateId } = require('../utils/validators/common.validators');
const { createHttpError } = require('../utils/errors/http.error');

const prepararFactura = async (client,data) => {
    if (!data || typeof data !== 'object') throw createHttpError('Datos del mantenimiento obligatorios',400);
    const modalidad = data.modalidad_pago ?? (data.id_factura_proveedor ? 'EXISTENTE' : 'DIRECTO');
    if (!['DIRECTO','NUEVA','EXISTENTE'].includes(modalidad)) throw createHttpError('Modalidad de pago inválida',400);
    if (modalidad === 'DIRECTO') {
        if (data.factura || data.id_factura_proveedor) throw createHttpError('Un pago directo no utiliza factura',400);
        return {...data,id_factura_proveedor:null};
    }
    let factura;
    if (modalidad === 'NUEVA') {
        if (data.id_factura_proveedor || !data.factura) throw createHttpError('Indique los datos de la nueva factura',400);
        if (data.factura.recepcion_inicial) throw createHttpError('Los materiales del taller no se reciben en inventario desde este formulario',400);
        if (!Array.isArray(data.factura.detalles) || !data.factura.detalles.length || typeof data.tipo !== 'string' || !data.tipo.trim()) {
            throw createHttpError('Indique el trabajo realizado y los importes de su servicio en la factura',400);
        }
        const [servicio,...adicionales] = data.factura.detalles;
        factura = await createFacturaEnTransaccion(client,{
            ...data.factura,id_proveedor:data.id_proveedor,
            detalles:[{...servicio,tipo_concepto:'SERVICIO',id_producto:null,descripcion:data.tipo.trim()},...adicionales]
        });
    } else {
        if (data.factura) throw createHttpError('No se puede crear y vincular una factura existente a la vez',400);
        factura = await facturaModel.findByIdForUpdate(client,validateId(data.id_factura_proveedor));
    }
    if (!factura || factura.estado !== 'REGISTRADA') throw createHttpError('Seleccione una factura vigente',409);
    if (factura.id_proveedor !== validateId(data.id_proveedor)) throw createHttpError('La factura no corresponde al proveedor',400);
    return {...data,id_factura_proveedor:factura.id_factura_proveedor,monto:factura.total};
};

const registrarDesembolso = async (client,mantenimiento,comprobante) => {
    if (Number(mantenimiento.monto)>0) {
        await gastoModel.create(client,{
            origen:'MANTENIMIENTO',id_mantenimiento:mantenimiento.id_mantenimiento,
            id_vehiculo:mantenimiento.id_vehiculo,id_proveedor:mantenimiento.id_proveedor,
            fecha:mantenimiento.fecha_inicio.slice(0,10),monto:mantenimiento.monto,
            numero_comprobante:comprobante,descripcion:'Pago directo del mantenimiento'
        });
    }
};
const crearPagoDirecto = async (client,mantenimiento,comprobante) => {
    await edicionModel.marcarPagoAutomatico(client,mantenimiento.id_mantenimiento);
    await registrarDesembolso(client,mantenimiento,comprobante);
};
module.exports={prepararFactura,registrarDesembolso,crearPagoDirecto};
