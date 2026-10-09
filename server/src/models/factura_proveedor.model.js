const pool = require("../config/database");

// Fragmentos constantes compartidos: nunca contienen valores recibidos por HTTP.
const resumenPagos = `LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(monto),0) AS total_pagado FROM pago_proveedor
    WHERE id_factura_proveedor=f.id_factura_proveedor AND estado='REGISTRADO'
) pagos ON true`;
const camposPago = `pagos.total_pagado::text AS total_pagado,
    (f.total-pagos.total_pagado)::text AS saldo_pendiente,
    CASE WHEN f.total=pagos.total_pagado THEN 'PAGADA'
         WHEN pagos.total_pagado>0 THEN 'PARCIAL' ELSE 'PENDIENTE' END AS estado_pago,
    (f.estado <> 'ANULADA' AND f.total>pagos.total_pagado
     AND COALESCE(f.fecha_vencimiento < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date,false)) AS vencida`;

const findAll = async () => {
    const result = await pool.query(`SELECT f.*, ${camposPago} FROM factura_proveedor f ${resumenPagos} ORDER BY f.id_factura_proveedor DESC`);
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`
        SELECT f.*, ${camposPago}, COALESCE((
            SELECT jsonb_agg(to_jsonb(d) || jsonb_build_object(
                'cantidad', d.cantidad::text, 'precio_unitario', d.precio_unitario::text,
                'descuento', d.descuento::text, 'subtotal', d.subtotal::text,
                'porcentaje_impuesto', d.porcentaje_impuesto::text,
                'impuesto', d.impuesto::text, 'total_linea', d.total_linea::text)
                ORDER BY d.id_detalle_factura_proveedor)
            FROM detalle_factura_proveedor d WHERE d.id_factura_proveedor = f.id_factura_proveedor
        ), '[]'::jsonb) AS detalles
        FROM factura_proveedor f ${resumenPagos} WHERE f.id_factura_proveedor = $1
    `, [id]);
    return result.rows[0];
};

const create = async (client, data) => {
    const result = await client.query(`
        INSERT INTO factura_proveedor (
            id_proveedor,
            numero_factura,
            fecha_emision,
            fecha_vencimiento,
            subtotal,
            descuento_total,
            impuestos,total
        )
        VALUES ($1, $2, $3, $4, 0, 0, 0, 0) 
        RETURNING *`,
        [
            data.id_proveedor,
            data.numero_factura,
            data.fecha_emision,
            data.fecha_vencimiento
        ]
    );
    return result.rows[0];
};

const updateTotales = async (client, id) => {
    const result = await client.query(`
        UPDATE factura_proveedor SET subtotal = t.subtotal, descuento_total = t.descuento,
            impuestos = t.impuestos, total = t.subtotal + t.impuestos
        FROM (
            SELECT SUM(subtotal) AS subtotal, 
            SUM(descuento) AS descuento, 
            SUM(impuesto) AS impuestos
        FROM detalle_factura_proveedor WHERE id_factura_proveedor=$1) t
        WHERE id_factura_proveedor=$1 RETURNING factura_proveedor.*`,
        [id]
    );
    return result.rows[0];
};

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(
        "SELECT * FROM factura_proveedor WHERE id_factura_proveedor = $1 FOR UPDATE",
        [id]
    );

    return result.rows[0];
};

const findCuentasPorPagar = async (id) => {
    return (await pool.query(`SELECT f.*, ${camposPago}
        FROM factura_proveedor f ${resumenPagos}
        WHERE f.id_proveedor=$1 AND f.estado <> 'ANULADA' AND f.total>pagos.total_pagado
        ORDER BY f.fecha_vencimiento NULLS LAST, f.id_factura_proveedor`, [id])).rows;
};

const getDependenciasVigentes = async (client, id) => {
    const result = await client.query(`SELECT
        EXISTS(SELECT 1 FROM pago_proveedor WHERE id_factura_proveedor=$1 AND estado='REGISTRADO') AS tiene_pagos,
        EXISTS(SELECT 1 FROM recepcion_compra WHERE id_factura_proveedor=$1 AND estado='REGISTRADA') AS tiene_recepciones`, [id]);
    return result.rows[0];
};

const anular = async (client, id, motivo) => {
    const result = await client.query(`UPDATE factura_proveedor
        SET estado='ANULADA', fecha_anulacion=CURRENT_TIMESTAMP, motivo_anulacion=$2
        WHERE id_factura_proveedor=$1 RETURNING *`, [id, motivo]);
    return result.rows[0];
};

module.exports = {
    getDependenciasVigentes,
    anular,
    findCuentasPorPagar,
    findByIdForUpdate,
    findAll,
    findById,
    create,
    updateTotales
};
