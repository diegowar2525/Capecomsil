const pool = require("../config/database");

// Metadatos administrativos; no es una consulta de autenticación.
const findByUsuario = async (idUsuario, client = pool) => {
    const result = await client.query(
        `
        SELECT id_sesion, id_usuario, fecha_creacion, fecha_expiracion, fecha_revocacion
        FROM sesion
        WHERE id_usuario = $1
        ORDER BY id_sesion DESC
        `,
        [idUsuario]
    );
    return result.rows;
};

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO sesion(id_usuario, token_hash, fecha_expiracion)
         VALUES ($1, $2, clock_timestamp() + $3 * interval '1 second')
         RETURNING id_sesion, fecha_expiracion`,
        [data.id_usuario, data.token_hash, data.segundos]
    );
    return result.rows[0] ?? null;
};

const findVigente = async (tokenHash, client = pool) => {
    const result = await client.query(
        `SELECT s.id_sesion, s.id_usuario, s.fecha_expiracion
         FROM sesion s JOIN usuario u USING (id_usuario)
         WHERE s.token_hash = $1 AND s.fecha_revocacion IS NULL
           AND s.fecha_expiracion > clock_timestamp() AND u.activo`, [tokenHash]
    );
    return result.rows[0] ?? null;
};

const revocar = async (tokenHash, client = pool) => {
    const result = await client.query(
        `UPDATE sesion SET fecha_revocacion = clock_timestamp()
         WHERE token_hash = $1 AND fecha_revocacion IS NULL RETURNING id_sesion`, [tokenHash]
    );
    return result.rows[0] ?? null;
};

const revocarByUsuario = async (client, idUsuario) => {
    const result = await client.query(
        `UPDATE sesion SET fecha_revocacion = clock_timestamp()
         WHERE id_usuario = $1 AND fecha_revocacion IS NULL RETURNING id_sesion`, [idUsuario]
    );
    return result.rows;
};

module.exports = {
    findByUsuario,
    create,
    findVigente,
    revocar,
    revocarByUsuario
};
