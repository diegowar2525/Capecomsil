const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT id_permiso, codigo, modulo, accion, exclusivo_jefe
        FROM permiso
        ORDER BY codigo
    `);
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT id_permiso, codigo, modulo, accion, exclusivo_jefe
        FROM permiso
        WHERE id_permiso = $1
        `,
        [id]
    );
    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById
};
