const pool = require("../config/database");
const findAll = async (client = pool) => (await client.query(`SELECT c.*, p.nombre AS provincia FROM ciudad c JOIN provincia p USING(id_provincia) ORDER BY id_ciudad`)).rows;
const findById = async (id, client = pool) => (await client.query(`SELECT c.*, p.nombre AS provincia FROM ciudad c JOIN provincia p USING(id_provincia) WHERE id_ciudad = $1`, [id])).rows[0] ?? null;
const create = async ({ id_provincia, nombre, estado }, client = pool) => (await client.query(
    `INSERT INTO ciudad (id_provincia, nombre, estado) VALUES ($1, $2, $3) RETURNING *`, [id_provincia, nombre, estado]
)).rows[0] ?? null;
const update = async (id, { id_provincia, nombre, estado }, client = pool) => (await client.query(
    `UPDATE ciudad SET id_provincia = $1, nombre = $2, estado = $3 WHERE id_ciudad = $4 RETURNING *`, [id_provincia, nombre, estado, id]
)).rows[0] ?? null;
const remove = async (id, client = pool) => (await client.query(`DELETE FROM ciudad WHERE id_ciudad = $1 RETURNING *`, [id])).rows[0] ?? null;
module.exports = { findAll, findById, create, update, remove };
