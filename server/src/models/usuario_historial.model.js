const pool = require("../config/database");

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO usuario_historial(id_usuario, id_actor, accion, motivo, anterior, posterior)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_historial`,
        [data.id_usuario, data.id_actor, data.accion, data.motivo, data.anterior, data.posterior]
    );
    return result.rows[0] ?? null;
};

const findByUsuario = async (id, client = pool) => {
    const result = await client.query(
        `SELECT id_historial, id_usuario, id_actor, accion, motivo, anterior, posterior, fecha
         FROM usuario_historial WHERE id_usuario=$1 ORDER BY id_historial DESC`, [id]
    );
    return result.rows;
};

module.exports = { create, findByUsuario };
