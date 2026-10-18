const pool = require("../config/database");

const findAll = async (filtros = {}, id = null, client = pool) => {
    const result = await client.query(
        `
        WITH
            corte AS (
                SELECT
                    COALESCE($5::timestamp, CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil') hasta
            ),
            base AS (
                SELECT
                    p.*,
                    v.placa,
                    corte.hasta,
                    kilometraje_vehiculo (p.id_vehiculo, corte.hasta) AS kilometraje_actual,
                    u.id_mantenimiento AS id_ultimo_mantenimiento,
                    u.fecha_fin AS fecha_ultimo_mantenimiento,
                    u.kilometraje_aplicado AS kilometraje_ultimo_mantenimiento,
                    COALESCE(u.kilometraje_aplicado, p.kilometraje_referencia_inicial) AS kilometraje_referencia
                FROM
                    plan_mantenimiento_vehiculo p
                    JOIN vehiculo v USING (id_vehiculo)
                    CROSS JOIN corte
                    LEFT JOIN LATERAL (
                        SELECT
                            m.id_mantenimiento,
                            m.fecha_fin,
                            c.kilometraje_aplicado
                        FROM
                            cumplimiento_plan_mantenimiento c
                            JOIN mantenimiento m USING (id_mantenimiento)
                        WHERE
                            c.id_plan_mantenimiento_vehiculo = p.id_plan_mantenimiento_vehiculo
                            AND m.estado = 'REGISTRADO'
                            AND m.fecha_fin IS NOT NULL
                            AND m.fecha_fin <= corte.hasta
                        ORDER BY
                            m.fecha_fin DESC,
                            m.id_mantenimiento DESC
                        LIMIT
                            1
                    ) u ON true
                WHERE
                    (
                        $1::int IS NULL
                        OR p.id_vehiculo = $1
                    )
                    AND (
                        $2::boolean IS NULL
                        OR p.estado = $2
                    )
                    AND (
                        $4::int IS NULL
                        OR p.id_plan_mantenimiento_vehiculo = $4
                    )
            ),
            calculo AS (
                SELECT
                    *,
                    CASE
                        WHEN kilometraje_actual IS NULL THEN NULL
                        ELSE kilometraje_referencia + intervalo_km
                    END AS proximo_mantenimiento_km
                FROM
                    base
            ),
            seguimiento AS (
                SELECT
                    *,
                    CASE
                        WHEN NOT estado THEN 'INACTIVO'
                        WHEN kilometraje_actual IS NULL THEN 'SIN_CONFIGURAR'
                        WHEN kilometraje_actual >= proximo_mantenimiento_km THEN 'VENCIDO'
                        WHEN proximo_mantenimiento_km - kilometraje_actual <= anticipacion_aviso_km THEN 'PROXIMO'
                        ELSE 'AL_DIA'
                    END AS situacion,
                    CASE
                        WHEN kilometraje_actual IS NULL THEN NULL
                        ELSE GREATEST(proximo_mantenimiento_km - kilometraje_actual, 0)
                    END AS kilometros_restantes,
                    CASE
                        WHEN kilometraje_actual IS NULL THEN NULL
                        ELSE GREATEST(kilometraje_actual - proximo_mantenimiento_km, 0)
                    END AS kilometros_excedidos,
                    kilometraje_actual - kilometraje_referencia AS kilometros_desde_referencia
                FROM
                    calculo
            )
        SELECT
            *,
            to_char(hasta, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_corte,
            to_char(fecha_ultimo_mantenimiento, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_ultimo_mantenimiento
        FROM
            seguimiento
        WHERE
            (
                $3::text IS NULL
                OR situacion = $3
            )
        ORDER BY
            id_vehiculo,
            id_plan_mantenimiento_vehiculo
    `,
        [filtros.id_vehiculo ?? null, filtros.estado ?? null, filtros.situacion ?? null, id, filtros.fecha_hasta ?? null]
    );

    return result.rows.map(({ hasta, ...row }) => row);
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            plan_mantenimiento_vehiculo
        WHERE
            id_plan_mantenimiento_vehiculo = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            plan_mantenimiento_vehiculo (
                id_vehiculo,
                nombre,
                intervalo_km,
                kilometraje_referencia_inicial,
                anticipacion_aviso_km,
                estado,
                observacion
            )
        VALUES
            ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            *
    `,
        [
            data.id_vehiculo,
            data.nombre,
            data.intervalo_km,
            data.kilometraje_referencia_inicial,
            data.anticipacion_aviso_km,
            data.estado,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `
        UPDATE plan_mantenimiento_vehiculo
        SET
            id_vehiculo = $2,
            nombre = $3,
            intervalo_km = $4,
            kilometraje_referencia_inicial = $5,
            anticipacion_aviso_km = $6,
            estado = $7,
            observacion = $8
        WHERE
            id_plan_mantenimiento_vehiculo = $1
        RETURNING
            *
    `,
        [
            id,
            data.id_vehiculo,
            data.nombre,
            data.intervalo_km,
            data.kilometraje_referencia_inicial,
            data.anticipacion_aviso_km,
            data.estado,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(
        `
        DELETE FROM plan_mantenimiento_vehiculo
        WHERE
            id_plan_mantenimiento_vehiculo = $1
        RETURNING
            *
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
