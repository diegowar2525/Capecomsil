const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT id_rol, codigo, nombre
        FROM rol
        ORDER BY codigo
    `);
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT id_rol, codigo, nombre
        FROM rol
        WHERE id_rol = $1
        `,
        [id]
    );
    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById
};
