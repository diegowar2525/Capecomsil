const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *,
            fecha::text AS fecha
        FROM
            feriado
        ORDER BY
            feriado.fecha DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *,
            fecha::text AS fecha
        FROM
            feriado
        WHERE
            id_feriado = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            feriado (fecha, descripcion, observacion)
        VALUES
            ($1, $2, $3)
        RETURNING
            *,
            fecha::text AS fecha
    `,
        [data.fecha, data.descripcion, data.observacion]
    );

    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `
        UPDATE feriado
        SET
            fecha = $2,
            descripcion = $3,
            observacion = $4
        WHERE
            id_feriado = $1
        RETURNING
            *,
            fecha::text AS fecha
    `,
        [id, data.fecha, data.descripcion, data.observacion]
    );

    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(
        `
        DELETE FROM feriado
        WHERE
            id_feriado = $1
        RETURNING
            *,
            fecha::text AS fecha
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
