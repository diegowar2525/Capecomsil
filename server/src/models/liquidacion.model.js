const pool = require("../config/database");

const consulta = `
    SELECT l.*, l.periodo_inicio::text AS periodo_inicio, l.periodo_fin::text AS periodo_fin,
        l.fecha_limite_confirmacion::text AS fecha_limite_confirmacion, g.nombre AS nombre_gasolinera
    FROM liquidacion l JOIN gasolinera g USING(id_gasolinera)
`;

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `${consulta}
         WHERE ($1::integer IS NULL OR l.id_gasolinera=$1)
           AND ($2::text IS NULL OR l.estado=$2)
           AND ($3::date IS NULL OR l.periodo_fin >= $3)
           AND ($4::date IS NULL OR l.periodo_inicio <= $4)
         ORDER BY l.id_liquidacion DESC LIMIT $5 OFFSET $6`,
        [filtros.id_gasolinera, filtros.estado, filtros.periodo_desde, filtros.periodo_hasta, filtros.limit, filtros.offset]
    );
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE l.id_liquidacion=$1`, [id]);
    return result.rows[0] ?? null;
};

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(`${consulta} WHERE l.id_liquidacion=$1 FOR UPDATE OF l`, [id]);
    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin,observacion,retencion,recargo)
         VALUES ($1,$2,$3,$4,0,0) RETURNING id_liquidacion`,
        [data.id_gasolinera, data.periodo_inicio, data.periodo_fin, data.observacion]
    );
    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `UPDATE liquidacion SET id_gasolinera=$2, periodo_inicio=$3, periodo_fin=$4,
         observacion=$5, version=version+1 WHERE id_liquidacion=$1 RETURNING id_liquidacion`,
        [id, data.id_gasolinera, data.periodo_inicio, data.periodo_fin, data.observacion]
    );
    return result.rows[0] ?? null;
};

const recalcularTotales = async (client, id) => {
    const result = await client.query(
        `UPDATE liquidacion SET total_galones=t.galones, valor_transporte=t.transporte,
         total_liquidacion=t.transporte, retencion=0, recargo=0
         FROM (SELECT COALESCE(sum(galones),0) AS galones, COALESCE(sum(valor_transporte),0) AS transporte
               FROM detalle_liquidacion WHERE id_liquidacion=$1) t
         WHERE id_liquidacion=$1 RETURNING id_liquidacion`, [id]
    );
    return result.rows[0] ?? null;
};

const cambiarEstado = async (client, id, estado, motivo) => {
    const result = await client.query(
        `UPDATE liquidacion SET estado=$2::text, version=version+1,
         fecha_envio=CASE WHEN $2='ENVIADA' THEN clock_timestamp() ELSE fecha_envio END,
         fecha_confirmacion=CASE WHEN $2='CONFIRMADA' THEN clock_timestamp() ELSE fecha_confirmacion END,
         fecha_anulacion=CASE WHEN $2='ANULADA' THEN clock_timestamp() ELSE fecha_anulacion END,
         motivo_anulacion=CASE WHEN $2='ANULADA' THEN $3 ELSE motivo_anulacion END
         WHERE id_liquidacion=$1 RETURNING id_liquidacion`, [id, estado, motivo ?? null]
    );
    return result.rows[0] ?? null;
};

const tieneFactura = async (client, id) => {
    const result = await client.query("SELECT EXISTS(SELECT 1 FROM factura WHERE id_liquidacion=$1) AS existe", [id]);
    return result.rows[0].existe;
};

const remove = async (client, id) => {
    const result = await client.query("DELETE FROM liquidacion WHERE id_liquidacion=$1 RETURNING id_liquidacion", [id]);
    return result.rows[0] ?? null;
};

module.exports = { findAll, findById, findByIdForUpdate, create, update, recalcularTotales, cambiarEstado, tieneFactura, remove };
