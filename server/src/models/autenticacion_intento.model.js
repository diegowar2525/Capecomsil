const pool = require("../config/database");

const registrar = async (claveHash, client = pool) => {
    const result = await client.query(
        `INSERT INTO autenticacion_intento(clave_hash, intentos, fecha_limite)
         VALUES ($1, 1, clock_timestamp() + interval '15 minutes')
         ON CONFLICT (clave_hash) DO UPDATE SET
            intentos = CASE WHEN autenticacion_intento.fecha_limite <= clock_timestamp()
                THEN 1 ELSE LEAST(autenticacion_intento.intentos + 1, 1000000) END,
            fecha_limite = CASE WHEN autenticacion_intento.fecha_limite <= clock_timestamp()
                THEN clock_timestamp() + interval '15 minutes' ELSE autenticacion_intento.fecha_limite END
         RETURNING intentos`, [claveHash]
    );
    return result.rows[0].intentos;
};

const limpiarVencidos = async () => {
    const result = await pool.query(`
        DELETE FROM autenticacion_intento WHERE fecha_limite <= clock_timestamp()
    `);
    return result.rowCount;
};

module.exports = {
    registrar,
    limpiarVencidos
};
