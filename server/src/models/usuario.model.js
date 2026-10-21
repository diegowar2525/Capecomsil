const pool = require("../config/database");

const camposPublicos = `u.id_usuario, u.nombre_usuario, u.nombre, u.id_rol,
    r.codigo AS rol, u.activo, u.requiere_cambio_password,
    u.fecha_creacion, u.fecha_actualizacion`;

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `
        SELECT ${camposPublicos}
        FROM usuario u JOIN rol r USING (id_rol)
        WHERE ($1::boolean IS NULL OR u.activo = $1)
          AND ($2::integer IS NULL OR u.id_rol = $2)
        ORDER BY u.id_usuario DESC
        LIMIT $3 OFFSET $4
        `,
        [filtros.activo, filtros.id_rol, filtros.limit, filtros.offset]
    );
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT ${camposPublicos}
        FROM usuario u JOIN rol r USING (id_rol)
        WHERE u.id_usuario = $1
        `,
        [id]
    );
    return result.rows[0] ?? null;
};

const lockAdministracion = async (client) => {
    const result = await client.query(`SELECT pg_advisory_xact_lock(72631, 2)`);
    return result.rows;
};

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(
        `SELECT ${camposPublicos} FROM usuario u JOIN rol r USING (id_rol)
         WHERE u.id_usuario = $1 FOR UPDATE OF u`, [id]
    );
    return result.rows[0] ?? null;
};

const countJefesActivos = async (client) => {
    const result = await client.query(
        `SELECT count(*)::integer AS total FROM usuario u JOIN rol r USING (id_rol)
         WHERE u.activo AND r.codigo = 'JEFE'`
    );
    return result.rows[0].total;
};

const create = async (client, data) => {
    const result = await client.query(
        `INSERT INTO usuario(nombre_usuario, nombre, id_rol, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id_usuario`,
        [data.nombre_usuario, data.nombre, data.id_rol, data.password_hash]
    );
    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `UPDATE usuario SET nombre_usuario=$2, nombre=$3, id_rol=$4,
         fecha_actualizacion=clock_timestamp() WHERE id_usuario=$1 RETURNING id_usuario`,
        [id, data.nombre_usuario, data.nombre, data.id_rol]
    );
    return result.rows[0] ?? null;
};

const updateEstado = async (client, id, activo) => {
    const result = await client.query(
        `UPDATE usuario SET activo=$2, fecha_actualizacion=clock_timestamp()
         WHERE id_usuario=$1 RETURNING id_usuario`, [id, activo]
    );
    return result.rows[0] ?? null;
};

const resetPassword = async (client, id, passwordHash) => {
    const result = await client.query(
        `UPDATE usuario SET password_hash=$2, requiere_cambio_password=true,
         fecha_actualizacion=clock_timestamp() WHERE id_usuario=$1 RETURNING id_usuario`, [id, passwordHash]
    );
    return result.rows[0] ?? null;
};

module.exports = {
    lockAdministracion,
    findByIdForUpdate,
    countJefesActivos,
    create,
    update,
    updateEstado,
    resetPassword,
    findAll,
    findById
};
