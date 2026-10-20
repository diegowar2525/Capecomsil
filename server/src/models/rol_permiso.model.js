const pool = require("../config/database");

const findByRol = async (idRol, client = pool) => {
    const result = await client.query(
        `
        SELECT p.id_permiso, p.codigo, p.modulo, p.accion, p.exclusivo_jefe
        FROM rol_permiso rp
        JOIN rol r USING (id_rol)
        JOIN permiso p USING (id_permiso)
        WHERE rp.id_rol = $1 AND (r.codigo = 'JEFE' OR NOT p.exclusivo_jefe)
        ORDER BY p.codigo
        `,
        [idRol]
    );
    return result.rows;
};

module.exports = {
    findByRol
};
