const pool = require("../config/database");

const recalcular = async (client, id, fecha) => {
    const result = await client.query(
        `
        SELECT
            recalcular_remuneracion ($1, $2) AS id
    `,
        [id, fecha]
    );

    return result.rows[0].id;
};

const consulta = `
        SELECT
            r.*,
            r.fecha::text AS fecha,
            c.nombre AS nombre_chofer,
            COALESCE(a.asignado, 0)::numeric(12, 2)::text AS costo_asignado,
            (r.total - COALESCE(a.asignado, 0))::numeric(12, 2)::text AS costo_sin_asignar
        FROM
            remuneracion_chofer r
            JOIN chofer c USING (id_chofer)
            LEFT JOIN LATERAL (
                SELECT
                    SUM(valor) AS asignado
                FROM
                    costo_viaje
                WHERE
                    id_remuneracion_chofer = r.id_remuneracion_chofer
            ) a ON true
    `;

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `${consulta} WHERE r.id_chofer=$1 AND r.fecha BETWEEN $2 AND $3 ORDER BY r.fecha`,
        [filtros.id_chofer, filtros.fecha_desde, filtros.fecha_hasta]
    );

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE r.id_remuneracion_chofer=$1`, [id]);

    return result.rows[0] ?? null;
};

const findFechasPeriodo = async (client, filtros) => {
    // El intervalo es explícito: no se infiere fecha de contratación ni antigüedad.
    const result = await client.query(
        `
        SELECT
            ($1::date + n)::text AS fecha
        FROM
            generate_series(0, $2::date - $1::date) n
        ORDER BY
            n
    `,
        [filtros.fecha_desde, filtros.fecha_hasta]
    );

    return result.rows;
};

// El corte depende de Ecuador, no de la zona horaria del servidor.
const findChoferesAutomaticos = async (client = pool) => (await client.query(`
    SELECT id_chofer FROM chofer WHERE fecha_inicio_trabajo IS NOT NULL ORDER BY id_chofer
`)).rows;

const findPendientes = async (id, client = pool) => (await client.query(`
    SELECT d.fecha::text AS fecha FROM chofer c
    CROSS JOIN LATERAL (SELECT c.fecha_inicio_trabajo + n AS fecha FROM generate_series(0,
        LEAST(COALESCE(c.fecha_fin_trabajo, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date - 1),
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date - 1) - c.fecha_inicio_trabajo) n) d
    WHERE c.id_chofer=$1 AND NOT EXISTS (SELECT 1 FROM remuneracion_chofer r WHERE r.id_chofer=c.id_chofer AND r.fecha=d.fecha)
      AND EXISTS (SELECT 1 FROM configuracion_remuneracion cf WHERE cf.fecha_inicio<=d.fecha AND (cf.fecha_fin IS NULL OR cf.fecha_fin>=d.fecha))
    ORDER BY d.fecha LIMIT 366
`, [id])).rows;

const findCobertura = async (filtros, client = pool) => (await client.query(`
    SELECT c.fecha_inicio_trabajo::text, c.fecha_fin_trabajo::text,
        ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date - 1)::text AS hasta_procesable,
        (SELECT COUNT(*)::integer FROM generate_series(
            GREATEST(c.fecha_inicio_trabajo,$2::date),
            LEAST(COALESCE(c.fecha_fin_trabajo,$3::date),$3::date,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date - 1),
            interval '1 day') d(fecha)
         WHERE c.fecha_inicio_trabajo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM remuneracion_chofer r WHERE r.id_chofer=c.id_chofer AND r.fecha=d.fecha::date)) AS dias_pendientes
    FROM chofer c WHERE c.id_chofer=$1
`, [filtros.id_chofer,filtros.fecha_desde,filtros.fecha_hasta])).rows[0] ?? null;

module.exports = {
    findChoferesAutomaticos, findPendientes, findCobertura,
    recalcular,
    findAll,
    findById,
    findFechasPeriodo
};
