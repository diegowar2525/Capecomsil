const pool = require("../config/database");

const findCredenciales = async (nombreUsuario, client = pool) => {
    const result = await client.query(
        `
        SELECT id_usuario, password_hash, activo
        FROM usuario
        WHERE nombre_usuario = $1
        `,
        [nombreUsuario]
    );
    return result.rows[0] ?? null;
};

const findUsuarioForUpdate = async (client, id) => {
    const result = await client.query(
        `
        SELECT id_usuario, password_hash, activo
        FROM usuario
        WHERE id_usuario = $1 FOR UPDATE
        `,
        [id]
    );
    return result.rows[0] ?? null;
};

const updatePassword = async (client, id, passwordHash) => {
    const result = await client.query(
        `
        UPDATE usuario SET password_hash = $2, requiere_cambio_password = false,
            fecha_actualizacion = clock_timestamp()
        WHERE id_usuario = $1
        RETURNING id_usuario
        `,
        [id, passwordHash]
    );
    return result.rows[0] ?? null;
};

const lockInstalacion = async (client) => {
    const result = await client.query(`
        SELECT pg_advisory_xact_lock(72631, 2)
    `);
    return result.rows;
};

const hasUsuarios = async (client) => {
    const result = await client.query(`
        SELECT EXISTS(SELECT 1 FROM usuario) AS existe
    `);
    return result.rows[0].existe;
};

const createPrimerJefe = async (client, data) => {
    const result = await client.query(
        `INSERT INTO usuario(nombre_usuario, nombre, password_hash, id_rol, requiere_cambio_password)
         SELECT $1, $2, $3, id_rol, false FROM rol WHERE codigo = 'JEFE'
         RETURNING id_usuario`, [data.nombre_usuario, data.nombre, data.password_hash]
    );
    return result.rows[0] ?? null;
};

module.exports = {
    findCredenciales,
    findUsuarioForUpdate,
    updatePassword,
    lockInstalacion,
    hasUsuarios,
    createPrimerJefe
};
