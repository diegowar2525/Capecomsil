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

const findByCodigoForShare = async (client, codigo) => {
    const result = await client.query(`
        SELECT * FROM tipo_gasto WHERE codigo = $1 FOR SHARE
    `, [codigo]);
    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const result = await client.query(`
        INSERT INTO tipo_gasto(codigo, nombre, descripcion, estado)
        VALUES ($1, $2, $3, $4) RETURNING *
    `, [data.codigo, data.nombre, data.descripcion, data.estado]);
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

module.exports = { findAll, findById, findByCodigoForShare, create, update, remove };
