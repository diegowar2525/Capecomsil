const pool = require("../config/database");
const findAll = async (ambito, client = pool) => (await client.query(`SELECT mo.*, ma.ambito FROM modelo mo JOIN marca ma USING(id_marca) WHERE ($1::text IS NULL OR ma.ambito=$1) ORDER BY mo.nombre`, [ambito])).rows;
const findById = async (id, client = pool) => (await client.query(`SELECT mo.*, ma.ambito FROM modelo mo JOIN marca ma USING(id_marca) WHERE mo.id_modelo=$1`,[id])).rows[0] ?? null;
const create = async ({nombre,estado,id_marca}, client=pool) => (await client.query(`INSERT INTO modelo(nombre,estado,id_marca) VALUES($1,$2,$3) RETURNING *`,[nombre,estado,id_marca])).rows[0];
const update = async (id, {nombre,estado}, client=pool) => (await client.query(`UPDATE modelo SET nombre=$1,estado=$2 WHERE id_modelo=$3 RETURNING *`,[nombre,estado,id])).rows[0] ?? null;
const remove = async (id,client=pool) => (await client.query(`DELETE FROM modelo WHERE id_modelo=$1 RETURNING *`,[id])).rows[0] ?? null;
module.exports = { findAll, findById, create, update, remove };
