const pool = require("../config/database");
const consulta = `SELECT f.historico,f.importe_pagado_previo,f.fecha_corte,f.archivo_origen,f.hoja_origen,f.fila_origen,f.huella_origen,f.id_factura,f.id_empresa, e.nombre AS nombre_empresa, e.ruc AS ruc_empresa, COALESCE(a.id_liquidaciones,ARRAY[]::int[]) AS id_liquidaciones, a.liquidaciones_resumen,f.numero_factura,f.subtotal,f.retencion,f.valor_neto,f.estado,f.observacion,
    f.fecha_creacion,f.id_usuario_creacion,f.fecha_anulacion,f.motivo_anulacion,f.id_usuario_anulacion,
    to_char(f.fecha_emision,'YYYY-MM-DD') AS fecha_emision,
    to_char(f.fecha_vencimiento,'YYYY-MM-DD') AS fecha_vencimiento,
    (f.importe_pagado_previo+COALESCE(p.cobrado,0))::numeric(14,2) AS total_cobrado,
    CASE WHEN f.estado='ANULADA' THEN 0 ELSE f.valor_neto-(f.importe_pagado_previo+COALESCE(p.cobrado,0)) END::numeric(14,2) AS saldo,
    CASE WHEN f.estado='ANULADA' THEN 'ANULADA' WHEN (f.importe_pagado_previo+COALESCE(p.cobrado,0))>=f.valor_neto THEN 'COBRADA'
        WHEN (f.importe_pagado_previo+COALESCE(p.cobrado,0))>0 THEN 'PARCIAL' ELSE 'PENDIENTE' END AS estado_cobro,
    COALESCE(f.estado<>'ANULADA' AND f.valor_neto>(f.importe_pagado_previo+COALESCE(p.cobrado,0)) AND f.fecha_vencimiento<CURRENT_DATE, false) AS vencida
    FROM factura f JOIN empresa e USING(id_empresa)
    LEFT JOIN LATERAL (SELECT array_agg(fl.id_liquidacion ORDER BY fl.id_liquidacion) id_liquidaciones,
        string_agg(fl.id_liquidacion::text, ', ' ORDER BY fl.id_liquidacion) liquidaciones_resumen
        FROM factura_liquidacion fl WHERE fl.id_factura=f.id_factura) a ON true
    LEFT JOIN LATERAL (SELECT sum(monto) AS cobrado FROM pago WHERE id_factura=f.id_factura AND estado='REGISTRADO') p ON TRUE`;
const findAll = async (filtros, client = pool) => {
    const result = await client.query(`SELECT * FROM (${consulta}) resumen
    WHERE ($1::int IS NULL OR EXISTS(SELECT 1 FROM factura_liquidacion fl JOIN liquidacion l USING(id_liquidacion)
        WHERE fl.id_factura=resumen.id_factura AND l.id_gasolinera=$1))
    AND ($2::int IS NULL OR $2=ANY(id_liquidaciones))
    AND ($3::date IS NULL OR fecha_emision::date >= $3) AND ($4::date IS NULL OR fecha_emision::date <= $4)
    AND ($5::text IS NULL OR estado=$5) AND ($6::text IS NULL OR estado_cobro=$6)
    AND ($9::int IS NULL OR id_empresa=$9) ORDER BY id_factura DESC LIMIT $7 OFFSET $8`, [filtros.id_gasolinera,filtros.id_liquidacion,filtros.fecha_desde,filtros.fecha_hasta,filtros.estado,filtros.estado_cobro,filtros.limit,filtros.offset,filtros.id_empresa]);
    return result.rows;
};
const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE f.id_factura=$1`, [id]);
    return result.rows[0] ?? null;
};
const findByIdForUpdate = async (client, id) => {
    const result = await client.query("SELECT *, to_char(fecha_corte,'YYYY-MM-DD') AS fecha_corte, to_char(fecha_emision,'YYYY-MM-DD') AS fecha_emision FROM factura WHERE id_factura=$1 FOR UPDATE", [id]);
    return result.rows[0] ?? null;
};
const create = async (client, data, usuario) => {
    const result = await client.query(`INSERT INTO factura
        (id_empresa,numero_factura,fecha_emision,fecha_vencimiento,subtotal,retencion,valor_neto,observacion,id_usuario_creacion)
        SELECT $1,$2,$3,$4,sum(valor_transporte+recargo),sum(retencion),sum(total_liquidacion),$5,$6
        FROM liquidacion WHERE id_liquidacion=ANY($7::int[]) RETURNING id_factura`,
        [data.id_empresa,data.numero_factura,data.fecha_emision,data.fecha_vencimiento,data.observacion,usuario,data.id_liquidaciones]);
    const factura = result.rows[0];
    await client.query(`INSERT INTO factura_liquidacion(id_factura,id_liquidacion)
        SELECT $1,unnest($2::int[])`, [factura.id_factura,data.id_liquidaciones]);
    return factura;
};
const findLiquidaciones = async (id, client = pool) => (await client.query(`
    SELECT l.*,l.periodo_inicio::text AS periodo_inicio,l.periodo_fin::text AS periodo_fin,g.nombre AS nombre_gasolinera FROM factura_liquidacion fl
    JOIN liquidacion l USING(id_liquidacion) JOIN gasolinera g USING(id_gasolinera)
    WHERE fl.id_factura=$1 ORDER BY l.id_liquidacion`, [id])).rows;

const anular = async (client, id, motivo, usuario) => {
    const result = await client.query(`UPDATE factura SET estado='ANULADA', fecha_anulacion=clock_timestamp(),motivo_anulacion=$2,id_usuario_anulacion=$3 WHERE id_factura=$1 RETURNING *`, [id,motivo,usuario]);
    return result.rows[0] ?? null;
};
module.exports = { findLiquidaciones, findAll, findById, findByIdForUpdate, create, anular };
