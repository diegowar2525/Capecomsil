const pool = require("../config/database");

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO viaje_historial(id_viaje,id_actor,motivo,version_anterior,version_nueva,anterior,posterior)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_historial`,
        [data.id_viaje, data.id_actor, data.motivo, data.anterior.version, data.posterior.version, data.anterior, data.posterior]
    );
    return result.rows[0] ?? null;
};

const findByViaje = async (id, client = pool) => {
    const result = await client.query(
        `SELECT id_historial,id_viaje,id_actor,motivo,version_anterior,version_nueva,anterior,posterior,fecha
         FROM viaje_historial WHERE id_viaje=$1 ORDER BY id_historial DESC`, [id]
    );
    return result.rows;
};

module.exports = { create, findByViaje };
