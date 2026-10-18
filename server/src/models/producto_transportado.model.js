const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *
        FROM
            producto_transportado
        ORDER BY
            id_producto_transportado
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            producto_transportado
        WHERE
            id_producto_transportado = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const { nombre, descripcion, unidad_medida, estado } = data;
    const result = await client.query(
        `
        INSERT INTO
            producto_transportado (nombre, descripcion, unidad_medida, estado)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            *
    `,
        [nombre, descripcion, unidad_medida, estado]
    );

    return result.rows[0] ?? null;
};

const update = async (id, data, client = pool) => {
    const { nombre, descripcion, unidad_medida, estado } = data;
    const result = await client.query(
        `
        UPDATE producto_transportado
        SET
            nombre = $1,
            descripcion = $2,
            unidad_medida = $3,
            estado = $4
        WHERE
            id_producto_transportado = $5
        RETURNING
            *
    `,
        [nombre, descripcion, unidad_medida, estado, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM producto_transportado
        WHERE
            id_producto_transportado = $1
        RETURNING
            *
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const findByIdForShare = async (client, id) => {
    const result = await client.query(
        `
        SELECT
            id_producto_transportado
        FROM
            producto_transportado
        WHERE
            id_producto_transportado = $1
        FOR SHARE
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findByIdForShare,
    findAll,
    findById,
    create,
    update,
    remove
};
