const pool = require("../config/database");

const consulta = `SELECT v.*, veh.placa, ch.nombre AS nombre_chofer,
    COALESCE(t.total_galones,0)::text AS total_galones,
    COALESCE(t.valor_transporte,0)::text AS valor_transporte
    FROM viaje v JOIN vehiculo veh USING (id_vehiculo) JOIN chofer ch USING (id_chofer)
    LEFT JOIN LATERAL (SELECT SUM(galones) AS total_galones, SUM(valor_transporte) AS valor_transporte
        FROM detalle_viaje WHERE id_viaje=v.id_viaje) t ON true`;

const findAll = async (f) => {
    return (await pool.query(`${consulta}
        WHERE ($1::date IS NULL OR v.fecha >= $1::date)
            AND ($2::date IS NULL OR v.fecha < $2::date + INTERVAL '1 day')
            AND ($3::integer IS NULL OR v.id_vehiculo=$3)
            AND ($4::integer IS NULL OR v.id_chofer=$4)
            AND ($5::text IS NULL OR v.estado=$5)
            AND (($6::integer IS NULL AND $7::integer IS NULL) OR EXISTS (
        SELECT 1 FROM detalle_viaje d JOIN tarifa ta USING (id_tarifa)
        WHERE d.id_viaje=v.id_viaje AND ($6::integer IS NULL OR ta.id_gasolinera=$6)
            AND ($7::integer IS NULL OR ta.id_terminal=$7)))
        ORDER BY v.fecha DESC,v.id_viaje DESC LIMIT $8 OFFSET $9`,
        [f.fecha_desde, f.fecha_hasta, f.id_vehiculo, f.id_chofer, f.estado, f.id_gasolinera, f.id_terminal, f.limit, f.offset])).rows;
};

const findById = async (id, client = pool) => {
    return (await client.query(`${consulta} WHERE v.id_viaje=$1`, [id])).rows[0];
};

const findByIdForUpdate = async (client, id) => {
    return (await client.query("SELECT * FROM viaje WHERE id_viaje=$1 FOR UPDATE", [id])).rows[0];
};

const anular = async (client, id, motivo) => {
    return (await client.query(`UPDATE viaje SET estado='ANULADO',fecha_anulacion=CURRENT_TIMESTAMP,
        motivo_anulacion=$2 WHERE id_viaje=$1 RETURNING *`, [id, motivo])).rows[0];
};

const create = async (client, data) => {
    return (await client.query(`
        INSERT INTO viaje (
            id_vehiculo,
            id_chofer,
            fecha
        )
        VALUES ($1,$2,$3) RETURNING *`,
        [
            data.id_vehiculo,
            data.id_chofer,
            data.fecha])
    ).rows[0];
};

const getTotales = async (client, id) => {
    return (await client.query(`
        SELECT SUM(galones)::text AS total_galones,
        SUM(valor_transporte)::text AS valor_transporte FROM detalle_viaje WHERE id_viaje=$1`, [id])
    ).rows[0];
};

module.exports = { findAll, findById, findByIdForUpdate, anular, create, getTotales };
