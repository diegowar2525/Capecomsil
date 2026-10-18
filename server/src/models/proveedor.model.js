const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *
        FROM
            proveedor
        ORDER BY
            id_proveedor
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            proveedor
        WHERE
            id_proveedor = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const { nombre, ruc, direccion, telefono, correo, estado } = data;
    const result = await client.query(
        `
        INSERT INTO
            proveedor (nombre, ruc, direccion, telefono, correo, estado)
        VALUES
            ($1, $2, $3, $4, $5, $6)
        RETURNING
            *
    `,
        [nombre, ruc, direccion, telefono, correo, estado]
    );

    return result.rows[0] ?? null;
};

const update = async (id, data, client = pool) => {
    const { nombre, ruc, direccion, telefono, correo, estado } = data;
    const result = await client.query(
        `
        UPDATE proveedor
        SET
            nombre = $1,
            ruc = $2,
            direccion = $3,
            telefono = $4,
            correo = $5,
            estado = $6
        WHERE
            id_proveedor = $7
        RETURNING
            *
    `,
        [nombre, ruc, direccion, telefono, correo, estado, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM proveedor
        WHERE
            id_proveedor = $1
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
            id_proveedor
        FROM
            proveedor
        WHERE
            id_proveedor = $1
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
