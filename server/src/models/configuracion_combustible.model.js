const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
        FROM
            configuracion_combustible
        ORDER BY
            configuracion_combustible.fecha_inicio DESC,
            id_configuracion_combustible DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
        FROM
            configuracion_combustible
        WHERE
            id_configuracion_combustible = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            configuracion_combustible (consumo_galones_km, precio_por_galon, fecha_inicio, fecha_fin, observacion)
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [
            data.consumo_galones_km,
            data.precio_por_galon,
            data.fecha_inicio,
            data.fecha_fin,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `
        UPDATE configuracion_combustible
        SET
            consumo_galones_km = $2,
            precio_por_galon = $3,
            fecha_inicio = $4,
            fecha_fin = $5,
            observacion = $6
        WHERE
            id_configuracion_combustible = $1
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [
            id,
            data.consumo_galones_km,
            data.precio_por_galon,
            data.fecha_inicio,
            data.fecha_fin,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(
        `
        DELETE FROM configuracion_combustible
        WHERE
            id_configuracion_combustible = $1
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const findVigenteForShare = async (client, fecha) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            configuracion_combustible
        WHERE
            fecha_inicio <= $1::date
            AND (
                fecha_fin IS NULL
                OR fecha_fin >= $1::date
            )
        FOR SHARE
    `,
        [fecha]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    findVigenteForShare
};
