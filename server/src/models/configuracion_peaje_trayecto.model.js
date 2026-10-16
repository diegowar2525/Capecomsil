const pool = require("../config/database");

const findAll = async () => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_peaje_trayecto ORDER BY configuracion_peaje_trayecto.fecha_inicio DESC,id_configuracion_peaje_trayecto DESC")).rows;
const findById = async (id) => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_peaje_trayecto WHERE id_configuracion_peaje_trayecto=$1", [id])).rows[0];
const create = async (client, data) => (await client.query("INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio,fecha_fin,observacion) VALUES ($1,$2,$3,$4,$5) RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [data.id_trayecto, data.importe, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const update = async (client, id, data) => (await client.query("UPDATE configuracion_peaje_trayecto SET id_trayecto=$2,importe=$3,fecha_inicio=$4,fecha_fin=$5,observacion=$6 WHERE id_configuracion_peaje_trayecto=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id, data.id_trayecto, data.importe, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const remove = async (client, id) => (await client.query("DELETE FROM configuracion_peaje_trayecto WHERE id_configuracion_peaje_trayecto=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id])).rows[0];
const findVigenteForShare = async (client, id, fecha) => (await client.query(
    "SELECT * FROM configuracion_peaje_trayecto WHERE id_trayecto=$1 AND fecha_inicio <= $2::date AND (fecha_fin IS NULL OR fecha_fin >= $2::date) FOR SHARE",
    [id, fecha])).rows[0];
module.exports = { findAll, findById, create, update, remove, findVigenteForShare };
