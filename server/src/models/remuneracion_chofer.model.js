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

module.exports = {
    recalcular,
    findAll,
    findById,
    findFechasPeriodo
};
