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
        `INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin,observacion,retencion,recargo,recargos)
         VALUES ($1,$2,$3,$4,0,0,$5::jsonb) RETURNING id_liquidacion`,
        [data.id_gasolinera, data.periodo_inicio, data.periodo_fin, data.observacion, JSON.stringify(data.recargos)]
    );
    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `UPDATE liquidacion SET id_gasolinera=$2, periodo_inicio=$3, periodo_fin=$4,
         observacion=$5, recargos=$6::jsonb, version=version+1 WHERE id_liquidacion=$1 RETURNING id_liquidacion`,
        [id, data.id_gasolinera, data.periodo_inicio, data.periodo_fin, data.observacion, JSON.stringify(data.recargos)]
    );
    return result.rows[0] ?? null;
};

const recalcularTotales = async (client, id) => {
    const result = await client.query(
        `UPDATE liquidacion SET total_galones=t.galones, valor_transporte=t.transporte,
         total_liquidacion=t.transporte-round(t.transporte*CASE WHEN g.agente_retencion THEN 0.01 ELSE 0 END,2)
             + COALESCE((SELECT sum((r->>'importe')::numeric) FROM jsonb_array_elements(recargos) r),0),
         retencion=round(t.transporte*CASE WHEN g.agente_retencion THEN 0.01 ELSE 0 END,2),
         tasa_retencion=CASE WHEN g.agente_retencion THEN 0.01 ELSE 0 END,
         recargo=COALESCE((SELECT sum((r->>'importe')::numeric) FROM jsonb_array_elements(recargos) r),0)
         FROM (SELECT COALESCE(sum(galones),0) AS galones, COALESCE(sum(valor_transporte),0) AS transporte
               FROM detalle_liquidacion WHERE id_liquidacion=$1) t, gasolinera g
         WHERE id_liquidacion=$1 AND g.id_gasolinera=liquidacion.id_gasolinera RETURNING id_liquidacion`, [id]
    );
    return result.rows[0] ?? null;
};

const cambiarEstado = async (client, id, estado, motivo) => {
    const result = await client.query(
        `UPDATE liquidacion SET estado=$2::text, version=version+1,
         fecha_envio=CASE WHEN $2='PREPARADA' THEN clock_timestamp() WHEN $2='BORRADOR' THEN NULL ELSE fecha_envio END,
         fecha_confirmacion=CASE WHEN $2='CONFIRMADA' THEN clock_timestamp() ELSE fecha_confirmacion END,
         fecha_anulacion=CASE WHEN $2='ANULADA' THEN clock_timestamp() ELSE fecha_anulacion END,
         motivo_anulacion=CASE WHEN $2='ANULADA' THEN $3 ELSE motivo_anulacion END
         WHERE id_liquidacion=$1 RETURNING id_liquidacion`, [id, estado, motivo ?? null]
    );
    return result.rows[0] ?? null;
};

const tieneFactura = async (client, id) => {
    const result = await client.query("SELECT EXISTS(SELECT 1 FROM factura WHERE id_liquidacion=$1 AND estado<>'ANULADA') AS existe", [id]);
    return result.rows[0].existe;
};

const remove = async (client, id) => {
    const result = await client.query("DELETE FROM liquidacion WHERE id_liquidacion=$1 RETURNING id_liquidacion", [id]);
    return result.rows[0] ?? null;
};

const registrarTransicion = async (client, id, anterior, nuevo, usuario, version) => {
    await client.query(`INSERT INTO liquidacion_estado_historial(id_liquidacion,estado_anterior,estado_nuevo,id_usuario,version)
        VALUES($1,$2,$3,$4,$5)`, [id, anterior, nuevo, usuario ?? null, version]);
};
const historial = async (client, id) => {
    const result = await client.query(`SELECT h.*, u.nombre AS usuario FROM liquidacion_estado_historial h
        LEFT JOIN usuario u USING(id_usuario) WHERE h.id_liquidacion=$1 ORDER BY h.id_historial DESC`, [id]);
    return result.rows;
};

module.exports = { registrarTransicion, historial, findAll, findById, findByIdForUpdate, create, update, recalcularTotales, cambiarEstado, tieneFactura, remove };

const viajeAnuladoDeGasolinera = async (client, id, gasolinera) => {
    const result = await client.query(`SELECT EXISTS(SELECT 1 FROM viaje v JOIN detalle_viaje d USING(id_viaje)
        WHERE v.id_viaje=$1 AND v.estado='ANULADO' AND d.id_gasolinera=$2) AS existe`, [id, gasolinera]);
    return result.rows[0].existe;
};
module.exports.viajeAnuladoDeGasolinera = viajeAnuladoDeGasolinera;

const ajustesVigentes = async (client, id) => {
    const result = await client.query(`SELECT l.retencion=round(l.valor_transporte*CASE WHEN g.agente_retencion THEN 0.01 ELSE 0 END,2)
        AND l.recargo=COALESCE((SELECT sum((r->>'importe')::numeric) FROM jsonb_array_elements(l.recargos) r),0) AS vigente
        FROM liquidacion l JOIN gasolinera g USING(id_gasolinera) WHERE id_liquidacion=$1`, [id]);
    return result.rows[0].vigente;
};
module.exports.ajustesVigentes = ajustesVigentes;
