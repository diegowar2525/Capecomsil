const pool = require("../config/database");

const findAll = async () => (await pool.query("SELECT *, fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_remuneracion ORDER BY configuracion_remuneracion.fecha_inicio DESC")).rows;

const findById = async (id) => (await pool.query("SELECT *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin FROM configuracion_remuneracion WHERE id_configuracion_remuneracion=$1", [id])).rows[0];

const create = async (client, data) => (await client.query(
    "INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio,fecha_fin,observacion) VALUES ($1,$2,$3,$4,$5) RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin",
    [data.importe_diario, data.adicional_dia_especial, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];

const update = async (client, id, data) => (await client.query(
    "UPDATE configuracion_remuneracion SET importe_diario=$2,adicional_dia_especial=$3,fecha_inicio=$4,fecha_fin=$5,observacion=$6 WHERE id_configuracion_remuneracion=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin",
    [id, data.importe_diario, data.adicional_dia_especial, data.fecha_inicio, data.fecha_fin, data.observacion])).rows[0];

const remove = async (client, id) => (await client.query("DELETE FROM configuracion_remuneracion WHERE id_configuracion_remuneracion=$1 RETURNING *,fecha_inicio::text AS fecha_inicio,fecha_fin::text AS fecha_fin", [id])).rows[0];

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
