const pool = require("../config/database");
const findAll = async (client = pool) => (await client.query(`SELECT * FROM provincia ORDER BY id_provincia`)).rows;
const findById = async (id, client = pool) => (await client.query(`SELECT * FROM provincia WHERE id_provincia = $1`, [id])).rows[0] ?? null;
const create = async ({ nombre, estado }, client = pool) => (await client.query(
    `INSERT INTO provincia (nombre, estado) VALUES ($1, $2) RETURNING *`, [nombre, estado]
)).rows[0] ?? null;
const update = async (id, { nombre, estado }, client = pool) => (await client.query(
    `UPDATE provincia SET nombre = $1, estado = $2 WHERE id_provincia = $3 RETURNING *`, [nombre, estado, id]
)).rows[0] ?? null;
const remove = async (id, client = pool) => (await client.query(`DELETE FROM provincia WHERE id_provincia = $1 RETURNING *`, [id])).rows[0] ?? null;
module.exports = { findAll, findById, create, update, remove };
