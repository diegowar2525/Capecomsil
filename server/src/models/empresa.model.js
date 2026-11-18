const pool = require("../config/database");
const findAll = async (client = pool) => (await client.query(`SELECT * FROM empresa ORDER BY id_empresa`)).rows;
const findById = async (id, client = pool) => (await client.query(`SELECT * FROM empresa WHERE id_empresa = $1`, [id])).rows[0] ?? null;
const create = async ({ nombre, ruc, estado }, client = pool) => (await client.query(
    `INSERT INTO empresa (nombre, ruc, estado) VALUES ($1, $2, $3) RETURNING *`, [nombre, ruc, estado]
)).rows[0] ?? null;
const update = async (id, { nombre, ruc, estado }, client = pool) => (await client.query(
    `UPDATE empresa SET nombre = $1, ruc = $2, estado = $3 WHERE id_empresa = $4 RETURNING *`, [nombre, ruc, estado, id]
)).rows[0] ?? null;
const remove = async (id, client = pool) => (await client.query(`DELETE FROM empresa WHERE id_empresa = $1 RETURNING *`, [id])).rows[0] ?? null;
module.exports = { findAll, findById, create, update, remove };
