const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *
        FROM
            categoria_producto
        ORDER BY
            id_categoria
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            categoria_producto
        WHERE
            id_categoria = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const { nombre, descripcion, estado, es_llanta } = data;
    const result = await client.query(
        `
        INSERT INTO
            categoria_producto (nombre, descripcion, estado, es_llanta)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            *
    `,
        [nombre, descripcion, estado, es_llanta]
    );

    return result.rows[0] ?? null;
};

const update = async (id, data, client = pool) => {
    const { nombre, descripcion, estado, es_llanta } = data;
    const result = await client.query(
        `
        UPDATE categoria_producto
        SET
            nombre = $1,
            descripcion = $2,
            estado = $3,
            es_llanta = $4
        WHERE
            id_categoria = $5
        RETURNING
            *
    `,
        [nombre, descripcion, estado, es_llanta, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM categoria_producto
        WHERE
            id_categoria = $1
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
