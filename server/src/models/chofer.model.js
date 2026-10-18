const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            id_chofer,
            nombre,
            cedula,
            telefono,
            tipo_remuneracion,
            imagen_url,
            estado
        FROM
            chofer
        ORDER BY
            id_chofer DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const query = `
        SELECT
            id_chofer,
            nombre,
            cedula,
            telefono,
            tipo_remuneracion,
            imagen_url,
            estado
        FROM
            chofer
        WHERE
            id_chofer = $1;
    `;
    const { rows } = await client.query(query, [id]);
    return rows[0] ?? null;
};

const create = async (
    { nombre, cedula, telefono, tipo_remuneracion, imagen_url, estado },
    client = pool
) => {
    const result = await client.query(
        `
        INSERT INTO
            chofer (nombre, cedula, telefono, tipo_remuneracion, imagen_url, estado)
        VALUES
            ($1, $2, $3, $4, $5, $6)
        RETURNING
            *;
    `,
        [nombre, cedula, telefono, tipo_remuneracion, imagen_url, estado]
    );

    return result.rows[0] ?? null;
};

const update = async (
    id,
    { nombre, cedula, telefono, tipo_remuneracion, imagen_url, estado },
    client = pool
) => {
    const result = await client.query(
        `
        UPDATE chofer
        SET
            nombre = $1,
            cedula = $2,
            telefono = $3,
            tipo_remuneracion = $4,
            imagen_url = $5,
            estado = $6
        WHERE
            id_chofer = $7
        RETURNING
            *;
    `,
        [nombre, cedula, telefono, tipo_remuneracion, imagen_url, estado, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM chofer
        WHERE
            id_chofer = $1
        RETURNING
            *;
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const findByIdForShare = async (client, id) => {
    const result = await client.query(
        `
        SELECT
            id_chofer
        FROM
            chofer
        WHERE
            id_chofer = $1
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
