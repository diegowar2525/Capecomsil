const pool = require("../config/database");

const findByUsuario = async (idUsuario, client = pool) => {
    const result = await client.query(
        `SELECT f.clave, f.url FROM usuario_foto f
         JOIN usuario u USING (id_usuario)
         WHERE f.id_usuario = $1 AND u.activo AND u.imagen_url = f.url`, [idUsuario]
    );
    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO usuario_foto(id_usuario, clave, url)
         VALUES ($1, $2, $3) RETURNING id_usuario`, [data.id_usuario, data.clave, data.url]
    );
    return result.rows[0];
};

module.exports = { findByUsuario, create };
