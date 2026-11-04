const pool = require("../config/database");
const select = `SELECT t.*, c.id_provincia, c.nombre AS ciudad, p.nombre AS provincia
    FROM terminal t LEFT JOIN ciudad c USING(id_ciudad) LEFT JOIN provincia p USING(id_provincia)`;
const findAll = async (client = pool) => (await client.query(`${select} ORDER BY id_terminal`)).rows;
const findById = async (id, client = pool) => (await client.query(`${select} WHERE id_terminal = $1`, [id])).rows[0] ?? null;

const create = async ({ nombre, ubicacion, estado, id_ciudad }, client = pool) => {
    const result = await client.query(
        `
        INSERT INTO
            terminal (nombre, ubicacion, estado, id_ciudad)
        VALUES
            ($1, $2, $3, $4)
        RETURNING
            *
    `,
        [nombre, ubicacion, estado, id_ciudad]
    );

    return result.rows[0] ?? null;
};

const update = async (id, { nombre, ubicacion, estado, id_ciudad }, client = pool) => {
    const result = await client.query(
        `
        UPDATE terminal
        SET
            nombre = $1,
            ubicacion = $2,
            estado = $3, id_ciudad = $4
        WHERE
            id_terminal = $5
        RETURNING
            *
    `,
        [nombre, ubicacion, estado, id_ciudad, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM terminal
        WHERE
            id_terminal = $1
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
