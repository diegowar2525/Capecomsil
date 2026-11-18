const pool = require("../config/database");
const consulta = `SELECT p.*,to_char(p.fecha_pago,'YYYY-MM-DD') AS fecha_pago,f.numero_factura,f.id_empresa,e.nombre AS nombre_empresa
    FROM pago p JOIN factura f USING(id_factura) JOIN empresa e USING(id_empresa)`;
const findAll = async (filtros, client = pool) => {
    const result = await client.query(`${consulta}
    WHERE ($1::int IS NULL OR p.id_factura=$1) AND ($2::int IS NULL OR EXISTS(SELECT 1 FROM factura_liquidacion fl JOIN liquidacion l USING(id_liquidacion)
        WHERE fl.id_factura=f.id_factura AND l.id_gasolinera=$2))
    AND ($3::date IS NULL OR p.fecha_pago >= $3) AND ($4::date IS NULL OR p.fecha_pago <= $4)
    AND ($5::text IS NULL OR p.estado=$5) AND ($8::int IS NULL OR f.id_empresa=$8) ORDER BY p.id_pago DESC LIMIT $6 OFFSET $7`,
    [filtros.id_factura,filtros.id_gasolinera,filtros.fecha_desde,filtros.fecha_hasta,filtros.estado,filtros.limit,filtros.offset,filtros.id_empresa]);
    return result.rows;
};
const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE p.id_pago=$1`, [id]);
    return result.rows[0] ?? null;
};
const findByFactura = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE p.id_factura=$1 ORDER BY p.id_pago DESC`, [id]);
    return result.rows;
};
const create = async (client, data, usuario) => {
    const result = await client.query(`INSERT INTO pago
    (id_factura,fecha_pago,monto,forma_pago,banco,numero_comprobante,observacion,id_usuario_creacion,id_banco)
    SELECT f.id_factura,$2,$3,$4,$5,$6,$7,$8,$9 FROM factura f WHERE f.id_factura=$1
    AND $3::numeric <= f.valor_neto-f.importe_pagado_previo-COALESCE((SELECT sum(monto) FROM pago WHERE id_factura=f.id_factura AND estado='REGISTRADO'),0)
    RETURNING id_pago`, [data.id_factura,data.fecha_pago,data.monto,data.forma_pago,data.banco,data.numero_comprobante,data.observacion,usuario,data.id_banco ?? null]);
    return result.rows[0] ?? null;
};
const anular = async (client, id, motivo, usuario) => {
    const result = await client.query(`UPDATE pago SET estado='ANULADO',fecha_anulacion=clock_timestamp(),motivo_anulacion=$2,id_usuario_anulacion=$3 WHERE id_pago=$1 RETURNING *`, [id,motivo,usuario]);
    return result.rows[0] ?? null;
};
module.exports = { findAll, findById, findByFactura, create, anular };
