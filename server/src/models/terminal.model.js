const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(`
        SELECT
            id_terminal,
            nombre,
            ubicacion,
            estado
        FROM terminal
        ORDER BY id_terminal DESC
    `);

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            id_terminal,
            nombre,
            ubicacion,
            estado
        FROM terminal
        WHERE id_terminal = $1
        `,
        [id]
    );

    return result.rows[0] || null;
};

const create = async ({ nombre, ubicacion, estado }) => {
    const result = await pool.query(
        `
        INSERT INTO terminal (
            nombre,
            ubicacion,
            estado
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [nombre, ubicacion, estado]
    );

    return result.rows[0];
};

const update = async (id, { nombre, ubicacion, estado }) => {
    const result = await pool.query(
        `
        UPDATE terminal
        SET
            nombre = $1,
            ubicacion = $2,
            estado = $3
        WHERE id_terminal = $4
        RETURNING *
        `,
        [nombre, ubicacion, estado, id]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM terminal
        WHERE id_terminal = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};