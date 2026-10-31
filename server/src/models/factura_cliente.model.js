const pool = require("../config/database");
const consulta = `SELECT f.id_factura,f.id_liquidacion,f.numero_factura,f.subtotal,f.retencion,f.valor_neto,f.estado,f.observacion,
    f.fecha_creacion,f.id_usuario_creacion,f.fecha_anulacion,f.motivo_anulacion,f.id_usuario_anulacion,
    to_char(f.fecha_emision,'YYYY-MM-DD') AS fecha_emision,
    to_char(f.fecha_vencimiento,'YYYY-MM-DD') AS fecha_vencimiento, l.id_gasolinera, g.nombre AS nombre_gasolinera,
    COALESCE(p.cobrado,0)::numeric(14,2) AS total_cobrado,
    CASE WHEN f.estado='ANULADA' THEN 0 ELSE f.valor_neto-COALESCE(p.cobrado,0) END::numeric(14,2) AS saldo,
    CASE WHEN f.estado='ANULADA' THEN 'ANULADA' WHEN COALESCE(p.cobrado,0)>=f.valor_neto THEN 'COBRADA'
        WHEN COALESCE(p.cobrado,0)>0 THEN 'PARCIAL' ELSE 'PENDIENTE' END AS estado_cobro,
    COALESCE(f.estado<>'ANULADA' AND f.valor_neto>COALESCE(p.cobrado,0) AND f.fecha_vencimiento<CURRENT_DATE, false) AS vencida
    FROM factura f JOIN liquidacion l USING(id_liquidacion) JOIN gasolinera g USING(id_gasolinera)
    LEFT JOIN LATERAL (SELECT sum(monto) AS cobrado FROM pago WHERE id_factura=f.id_factura AND estado='REGISTRADO') p ON TRUE`;
const findAll = async (filtros, client = pool) => {
    const result = await client.query(`SELECT * FROM (${consulta}) resumen
    WHERE ($1::int IS NULL OR id_gasolinera=$1) AND ($2::int IS NULL OR id_liquidacion=$2)
    AND ($3::date IS NULL OR fecha_emision::date >= $3) AND ($4::date IS NULL OR fecha_emision::date <= $4)
    AND ($5::text IS NULL OR estado=$5) AND ($6::text IS NULL OR estado_cobro=$6)
    ORDER BY id_factura DESC LIMIT $7 OFFSET $8`, [filtros.id_gasolinera,filtros.id_liquidacion,filtros.fecha_desde,filtros.fecha_hasta,filtros.estado,filtros.estado_cobro,filtros.limit,filtros.offset]);
    return result.rows;
};
const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE f.id_factura=$1`, [id]);
    return result.rows[0] ?? null;
};
const findByIdForUpdate = async (client, id) => {
    const result = await client.query("SELECT *, to_char(fecha_emision,'YYYY-MM-DD') AS fecha_emision FROM factura WHERE id_factura=$1 FOR UPDATE", [id]);
    return result.rows[0] ?? null;
};
const create = async (client, data, usuario) => {
    const result = await client.query(`INSERT INTO factura
    (id_liquidacion,numero_factura,fecha_emision,fecha_vencimiento,subtotal,retencion,valor_neto,observacion,id_usuario_creacion)
    SELECT id_liquidacion,$2,$3,$4,valor_transporte+recargo,retencion,total_liquidacion,$5,$6 FROM liquidacion WHERE id_liquidacion=$1 RETURNING id_factura`,
    [data.id_liquidacion,data.numero_factura,data.fecha_emision,data.fecha_vencimiento,data.observacion,usuario]);
    return result.rows[0] ?? null;
};
const anular = async (client, id, motivo, usuario) => {
    const result = await client.query(`UPDATE factura SET estado='ANULADA', fecha_anulacion=clock_timestamp(),motivo_anulacion=$2,id_usuario_anulacion=$3 WHERE id_factura=$1 RETURNING *`, [id,motivo,usuario]);
    return result.rows[0] ?? null;
};
module.exports = { findAll, findById, findByIdForUpdate, create, anular };
