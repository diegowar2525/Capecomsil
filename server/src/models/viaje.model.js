const pool = require("../config/database");

const consulta = `
        SELECT
            v.*,
            to_char(v.fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            to_char(v.fecha_fin, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin,
            veh.placa,
            ch.nombre AS nombre_chofer,
            COALESCE(t.total_galones, 0)::text AS total_galones,
            COALESCE(t.valor_transporte, 0)::text AS valor_transporte,
            (
                SELECT
                    COALESCE(SUM(kilometros), 0)::text
                FROM
                    tramo_viaje
                WHERE
                    id_viaje = v.id_viaje
            ) AS kilometros_recorridos
        FROM
            viaje v
            JOIN vehiculo veh USING (id_vehiculo)
            JOIN chofer ch USING (id_chofer)
            LEFT JOIN LATERAL (
                SELECT
                    SUM(galones) AS total_galones,
                    SUM(valor_transporte) AS valor_transporte
                FROM
                    detalle_viaje
                WHERE
                    id_viaje = v.id_viaje
            ) t ON true
    `;

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `${consulta}
        WHERE ($1::date IS NULL OR v.fecha_inicio::date >= $1::date)
            AND ($2::date IS NULL OR v.fecha_inicio::date <= $2::date)
            AND ($3::integer IS NULL OR v.id_vehiculo=$3)
            AND ($4::integer IS NULL OR v.id_chofer=$4)
            AND ($5::text IS NULL OR v.estado=$5)
            AND (($6::integer IS NULL AND $7::integer IS NULL) OR EXISTS (
        SELECT 1 FROM detalle_viaje d JOIN tarifa ta USING (id_tarifa)
        WHERE d.id_viaje=v.id_viaje AND ($6::integer IS NULL OR ta.id_gasolinera=$6)
            AND ($7::integer IS NULL OR ta.id_terminal=$7)))
        ORDER BY v.fecha_inicio DESC,v.id_viaje DESC LIMIT $8 OFFSET $9`,
        [
            filtros.fecha_desde,
            filtros.fecha_hasta,
            filtros.id_vehiculo,
            filtros.id_chofer,
            filtros.estado,
            filtros.id_gasolinera,
            filtros.id_terminal,
            filtros.limit,
            filtros.offset
        ]
    );

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`${consulta} WHERE v.id_viaje=$1`, [id]);

    return result.rows[0] ?? null;
};

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(
        `
        SELECT
            *,
            to_char(fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            to_char(fecha_fin, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin
        FROM
            viaje
        WHERE
            id_viaje = $1
        FOR UPDATE
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const anular = async (client, id, motivo) => {
    const result = await client.query(
        `
        UPDATE viaje
        SET
            estado = 'ANULADO',
            fecha_anulacion = CURRENT_TIMESTAMP,
            motivo_anulacion = $2
        WHERE
            id_viaje = $1
        RETURNING
            *
    `,
        [id, motivo]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            viaje (id_vehiculo, id_chofer, fecha_inicio, fecha_fin)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            *,
            to_char(fecha_inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            to_char(fecha_fin, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin
    `,
        [data.id_vehiculo, data.id_chofer, data.fecha_inicio, data.fecha_fin]
    );

    return result.rows[0] ?? null;
};

const getTotales = async (client, id) => {
    const result = await client.query(
        `
        SELECT
            SUM(galones)::text AS total_galones,
            SUM(valor_transporte)::text AS valor_transporte,
            (
                SELECT
                    SUM(kilometros)::text
                FROM
                    tramo_viaje
                WHERE
                    id_viaje = $1
            ) AS kilometros_recorridos
        FROM
            detalle_viaje
        WHERE
            id_viaje = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const countRegistradosByChoferFecha = async (client, idChofer, fecha) => {
    const result = await client.query(
        `
        SELECT
            count(*)::int n
        FROM
            viaje
        WHERE
            id_chofer = $1
            AND fecha_inicio::date = $2
            AND estado = 'REGISTRADO'
    `,
        [idChofer, fecha]
    );

    return result.rows[0].n;
};

module.exports = {
    countRegistradosByChoferFecha,
    findAll,
    findById,
    findByIdForUpdate,
    anular,
    create,
    getTotales
};
