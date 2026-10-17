const pool = require("../config/database");

const select = `
    SELECT a.*, to_char(a.fecha_hora,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_hora,
        g.monto, g.id_proveedor, g.numero_comprobante, g.estado, g.motivo_anulacion,
        to_char(g.fecha_anulacion,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_anulacion
    FROM abastecimiento_combustible a JOIN gasto g ON g.id_gasto=a.id_gasto`;

const findAll = async f => (await pool.query(`${select}
    WHERE ($1::int IS NULL OR a.id_vehiculo=$1) AND ($2::int IS NULL OR g.id_proveedor=$2)
    AND ($3::date IS NULL OR a.fecha_hora >= $3::date)
    AND ($4::date IS NULL OR a.fecha_hora < $4::date + INTERVAL '1 day')
    AND ($5::text IS NULL OR g.estado=$5)
    ORDER BY a.fecha_hora DESC,a.id_abastecimiento_combustible DESC LIMIT $6 OFFSET $7`,
    [f.id_vehiculo, f.id_proveedor, f.fecha_desde, f.fecha_hasta, f.estado, f.limit, f.offset])).rows;

const findById = async (id, client = pool) => (await client.query(`${select} WHERE a.id_abastecimiento_combustible=$1`, [id])).rows[0];

const create = async (client, d, idGasto) => (await client.query(`
    INSERT INTO abastecimiento_combustible
    (id_vehiculo,id_gasto,fecha_hora,kilometraje_odometro,galones,precio_por_galon,tanque_lleno,observacion)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_abastecimiento_combustible`,
    [d.id_vehiculo, idGasto, d.fecha_hora, d.kilometraje_odometro, d.galones, d.precio_por_galon, d.tanque_lleno, d.observacion])).rows[0];

const validarOdometro = async (client, d) => (await client.query(`
    SELECT EXISTS (SELECT 1 FROM abastecimiento_combustible a JOIN gasto g USING(id_gasto)
    WHERE a.id_vehiculo=$1 AND g.estado='REGISTRADO' AND (
        (a.fecha_hora < $2::timestamp AND a.kilometraje_odometro > $3::numeric)
        OR (a.fecha_hora > $2::timestamp AND a.kilometraje_odometro < $3::numeric)
        OR (a.fecha_hora = $2::timestamp))) AS conflicto`, [d.id_vehiculo, d.fecha_hora, d.kilometraje_odometro])).rows[0].conflicto;

const calcularMonto = async (client, d) => (await client.query(
    "SELECT round($1::numeric * $2::numeric,2)::text AS monto", [d.galones, d.precio_por_galon])).rows[0].monto;

module.exports = {
    findAll,
    findById,
    create,
    validarOdometro,
    calcularMonto
};
