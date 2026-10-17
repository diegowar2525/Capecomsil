const pool = require("../config/database");

const select = `
    SELECT g.*, to_char(g.fecha,'YYYY-MM-DD') AS fecha,
        to_char(g.fecha_anulacion,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_anulacion,
        a.id_abastecimiento_combustible FROM gasto g
    LEFT JOIN abastecimiento_combustible a ON a.id_gasto=g.id_gasto`;

const findAll = async f => (await pool.query(`${select}
    WHERE ($1::int IS NULL OR g.id_vehiculo=$1) AND ($2::int IS NULL OR g.id_viaje=$2)
    AND ($3::int IS NULL OR g.id_proveedor=$3) AND ($4::int IS NULL OR g.id_viatico_chofer=$4)
    AND ($5::date IS NULL OR g.fecha >= $5) AND ($6::date IS NULL OR g.fecha <= $6)
    AND ($7::text IS NULL OR g.estado=$7) AND ($8::text IS NULL OR g.tipo_gasto=$8)
    ORDER BY g.fecha DESC,g.id_gasto DESC LIMIT $9 OFFSET $10`,
    [f.id_vehiculo, f.id_viaje, f.id_proveedor, f.id_viatico_chofer, f.fecha_desde, f.fecha_hasta, f.estado, f.tipo_gasto, f.limit, f.offset])).rows;

const findById = async (id, client = pool) => (await client.query(`${select} WHERE g.id_gasto=$1`, [id])).rows[0];

const create = async (client, d) => (await client.query(`
    INSERT INTO gasto
        (id_viaje,id_vehiculo,id_proveedor,id_viatico_chofer,fecha,tipo_gasto,monto,descripcion,numero_comprobante,observacion)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id_gasto`,
    [d.id_viaje, d.id_vehiculo, d.id_proveedor, d.id_viatico_chofer, d.fecha, d.tipo_gasto, d.monto, d.descripcion, d.numero_comprobante, d.observacion])).rows[0];

const anular = async (client, id, motivo) => (await client.query(`
    UPDATE gasto SET estado='ANULADO',
        fecha_anulacion=CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil',motivo_anulacion=$2
    WHERE id_gasto=$1 AND estado='REGISTRADO' RETURNING id_gasto`, [id, motivo])).rows[0];

const referencias = async (client, d) => {
    const vehiculo = d.id_vehiculo ? (await client.query("SELECT id_vehiculo FROM vehiculo WHERE id_vehiculo=$1 FOR SHARE", [d.id_vehiculo])).rows[0] : null;
    const proveedor = d.id_proveedor ? (await client.query("SELECT id_proveedor FROM proveedor WHERE id_proveedor=$1 FOR SHARE", [d.id_proveedor])).rows[0] : null;
    const viaje = d.id_viaje ? (await client.query("SELECT id_vehiculo,estado FROM viaje WHERE id_viaje=$1 FOR SHARE", [d.id_viaje])).rows[0] : null;
    const viatico = d.id_viatico_chofer ? (await client.query("SELECT id_viatico_chofer FROM viatico_chofer WHERE id_viatico_chofer=$1 FOR SHARE", [d.id_viatico_chofer])).rows[0] : null;
    return { vehiculo, proveedor, viaje, viatico };
};

module.exports = {
    findAll,
    findById,
    create,
    anular,
    referencias
};
