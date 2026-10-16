const pool = require("../config/database");

const findAll = async () => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_combustible ORDER BY configuracion_combustible.fecha_inicio DESC,id_configuracion_combustible DESC")).rows;
const findById = async (id) => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_combustible WHERE id_configuracion_combustible=$1", [id])).rows[0];
const create = async (client, data) => (await client.query("INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio,fecha_fin,observacion) VALUES ($1,$2,$3,$4,$5) RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [data.consumo_galones_km, data.precio_por_galon, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const update = async (client, id, data) => (await client.query("UPDATE configuracion_combustible SET consumo_galones_km=$2,precio_por_galon=$3,fecha_inicio=$4,fecha_fin=$5,observacion=$6 WHERE id_configuracion_combustible=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id, data.consumo_galones_km, data.precio_por_galon, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];
const remove = async (client, id) => (await client.query("DELETE FROM configuracion_combustible WHERE id_configuracion_combustible=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id])).rows[0];
const findVigenteForShare = async (client, fecha) => (await client.query(
    "SELECT * FROM configuracion_combustible WHERE fecha_inicio <= $1::date AND (fecha_fin IS NULL OR fecha_fin >= $1::date) FOR SHARE",
    [fecha])).rows[0];
module.exports = { findAll, findById, create, update, remove, findVigenteForShare };
