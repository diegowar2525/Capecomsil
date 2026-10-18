const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
        FROM
            configuracion_viatico
        ORDER BY
            configuracion_viatico.fecha_inicio DESC,
            id_configuracion_viatico DESC
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
            configuracion_viatico
        WHERE
            id_configuracion_viatico = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            configuracion_viatico (importe_diario, fecha_inicio, fecha_fin, observacion)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [data.importe_diario, data.fecha_inicio, data.fecha_fin, data.observacion]
    );

    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `
        UPDATE configuracion_viatico
        SET
            importe_diario = $2,
            fecha_inicio = $3,
            fecha_fin = $4,
            observacion = $5
        WHERE
            id_configuracion_viatico = $1
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [id, data.importe_diario, data.fecha_inicio, data.fecha_fin, data.observacion]
    );

    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(
        `
        DELETE FROM configuracion_viatico
        WHERE
            id_configuracion_viatico = $1
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
            configuracion_viatico
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
