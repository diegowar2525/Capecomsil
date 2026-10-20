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

module.exports = {
    findAll,
    findById
};
