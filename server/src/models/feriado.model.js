const pool = require("../config/database");

const findAll = async () => (await pool.query("SELECT *,fecha::text AS fecha FROM feriado ORDER BY feriado.fecha DESC")).rows;

const findById = async (id) => (await pool.query("SELECT *,fecha::text AS fecha FROM feriado WHERE id_feriado=$1", [id])).rows[0];

const create = async (client, data) => (await client.query(
    "INSERT INTO feriado(fecha,descripcion,observacion) VALUES ($1,$2,$3) RETURNING *,fecha::text AS fecha",
    [data.fecha, data.descripcion, data.observacion])).rows[0];

const update = async (client, id, data) => (await client.query(
    "UPDATE feriado SET fecha=$2,descripcion=$3,observacion=$4 WHERE id_feriado=$1 RETURNING *,fecha::text AS fecha",
    [id, data.fecha, data.descripcion, data.observacion])).rows[0];

const remove = async (client, id) => (await client.query("DELETE FROM feriado WHERE id_feriado=$1 RETURNING *,fecha::text AS fecha", [id])).rows[0];

module.exports = { 
    findAll, 
    findById, 
    create, 
    update, 
    remove 
};
