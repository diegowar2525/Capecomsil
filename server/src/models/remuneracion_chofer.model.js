const pool = require("../config/database");

const lock = async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72631,1)");
};

const recalcular = async (client, id, fecha) => {
    return (await client.query("SELECT recalcular_remuneracion($1,$2) AS id", [id, fecha])).rows[0].id;
};

const consulta = `
    SELECT r.*, r.fecha::text AS fecha, c.nombre AS nombre_chofer,
        COALESCE(a.asignado,0)::numeric(12,2)::text AS costo_asignado,
        (r.total-COALESCE(a.asignado,0))::numeric(12,2)::text AS costo_sin_asignar
    FROM remuneracion_chofer r JOIN chofer c USING(id_chofer)
        LEFT JOIN LATERAL (SELECT SUM(valor) AS asignado FROM costo_viaje
    WHERE id_remuneracion_chofer=r.id_remuneracion_chofer) a ON true`;

const findAll = async (f, client = pool) => {
    return (await client.query(`${consulta} WHERE r.id_chofer=$1 AND r.fecha BETWEEN $2 AND $3 ORDER BY r.fecha`,
        [f.id_chofer, f.fecha_desde, f.fecha_hasta])).rows;
};

const findById = async (id, client = pool) => {
    return (await client.query(`${consulta} WHERE r.id_remuneracion_chofer=$1`, [id])).rows[0];
};

const generar = async (client, f) => {
    // El intervalo es explícito: no se infiere fecha de contratación ni antigüedad.
    const fechas = (await client.query(`SELECT ($1::date+n)::text AS fecha
        FROM generate_series(0,$2::date-$1::date) n ORDER BY n`, [f.fecha_desde, f.fecha_hasta])).rows;
    for (const { fecha } of fechas) await recalcular(client, f.id_chofer, fecha);
};

module.exports = {
    lock,
    recalcular,
    findAll,
    findById,
    generar
};
