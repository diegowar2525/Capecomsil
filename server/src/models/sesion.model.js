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

module.exports = {
    findByUsuario
};
