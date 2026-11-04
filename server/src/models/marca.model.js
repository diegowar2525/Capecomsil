const pool = require("../config/database");
const findAll = async (ambito, client = pool) => (await client.query(`SELECT ma.* FROM marca ma WHERE ($1::text IS NULL OR ma.ambito=$1) ORDER BY ma.nombre`, [ambito])).rows;
const findById = async (id, client = pool) => (await client.query(`SELECT ma.* FROM marca ma WHERE ma.id_marca=$1`,[id])).rows[0] ?? null;
const create = async ({nombre,estado,ambito}, client=pool) => (await client.query(`INSERT INTO marca(nombre,estado,ambito) VALUES($1,$2,$3) RETURNING *`,[nombre,estado,ambito])).rows[0];
const update = async (id, {nombre,estado}, client=pool) => (await client.query(`UPDATE marca SET nombre=$1,estado=$2 WHERE id_marca=$3 RETURNING *`,[nombre,estado,id])).rows[0] ?? null;
const remove = async (id,client=pool) => (await client.query(`DELETE FROM marca WHERE id_marca=$1 RETURNING *`,[id])).rows[0] ?? null;
module.exports = { findAll, findById, create, update, remove };
