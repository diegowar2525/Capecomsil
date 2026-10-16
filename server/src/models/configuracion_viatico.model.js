const pool = require("../config/database");

const findAll = async () => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_viatico ORDER BY configuracion_viatico.fecha_inicio DESC,id_configuracion_viatico DESC")).rows;
const findById = async (id) => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_viatico WHERE id_configuracion_viatico=$1", [id])).rows[0];
const create = async (client, data) => (await client.query("INSERT INTO configuracion_viatico(importe_diario,fecha_inicio,fecha_fin,observacion) VALUES ($1,$2,$3,$4) RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [data.importe_diario, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const update = async (client, id, data) => (await client.query("UPDATE configuracion_viatico SET importe_diario=$2,fecha_inicio=$3,fecha_fin=$4,observacion=$5 WHERE id_configuracion_viatico=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id, data.importe_diario, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const remove = async (client, id) => (await client.query("DELETE FROM configuracion_viatico WHERE id_configuracion_viatico=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id])).rows[0];
const findVigenteForShare = async (client, fecha) => (await client.query(
    "SELECT * FROM configuracion_viatico WHERE fecha_inicio <= $1::date AND (fecha_fin IS NULL OR fecha_fin >= $1::date) FOR SHARE",
    [fecha])).rows[0];
module.exports = { findAll, findById, create, update, remove, findVigenteForShare };
