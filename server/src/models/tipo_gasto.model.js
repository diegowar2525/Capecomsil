const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT * FROM tipo_gasto ORDER BY id_tipo_gasto
    `);
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`
        SELECT * FROM tipo_gasto WHERE id_tipo_gasto = $1
    `, [id]);
    return result.rows[0] ?? null;
};

const findByIdForShare = async (client, id) => {
    const result = await client.query(`
        SELECT * FROM tipo_gasto WHERE id_tipo_gasto = $1 FOR SHARE
    `, [id]);
    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const result = await client.query(`
        INSERT INTO tipo_gasto(nombre, descripcion, estado)
        VALUES ($1, $2, $3) RETURNING *
    `, [data.nombre, data.descripcion, data.estado]);
    return result.rows[0] ?? null;
};

const update = async (id, data, client = pool) => {
    const result = await client.query(`
        UPDATE tipo_gasto SET nombre = $2, descripcion = $3, estado = $4
        WHERE id_tipo_gasto = $1 RETURNING *
    `, [id, data.nombre, data.descripcion, data.estado]);
    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(`
        DELETE FROM tipo_gasto WHERE id_tipo_gasto = $1 RETURNING *
    `, [id]);
    return result.rows[0] ?? null;
};

module.exports = { findAll, findById, findByIdForShare, create, update, remove };
