const pool = require("../config/database");

const programarBorrado = async (clave, client = pool) => {
    const result = await client.query(
        `INSERT INTO archivo_borrado_pendiente(clave, disponible_desde)
         VALUES ($1, clock_timestamp() + interval '1 hour')
         ON CONFLICT (clave) DO NOTHING RETURNING clave`, [clave]
    );
    return result.rows[0] ?? null;
};

const cancelarBorrado = async (client, clave) => {
    const result = await client.query(
        `DELETE FROM archivo_borrado_pendiente WHERE clave = $1 RETURNING clave`, [clave]
    );
    return result.rows[0] ?? null;
};

const lockBorradoPendiente = async (client) => {
    const result = await client.query(
        `SELECT p.clave FROM archivo_borrado_pendiente p
         WHERE p.disponible_desde <= clock_timestamp()
         AND NOT EXISTS (SELECT 1 FROM usuario_foto f WHERE f.clave = p.clave)
         AND NOT EXISTS (SELECT 1 FROM catalogo_foto f WHERE f.clave = p.clave)
         ORDER BY p.disponible_desde LIMIT 1 FOR UPDATE OF p SKIP LOCKED`
    );
    return result.rows[0] ?? null;
};

module.exports = { programarBorrado, cancelarBorrado, lockBorradoPendiente };
