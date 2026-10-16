// Coordina horarios, costos y remuneraciones dentro de una transacción abierta.
// Usar el mismo client de BEGIN; PostgreSQL libera el bloqueo en COMMIT o ROLLBACK.
// La clave debe coincidir con las funciones y triggers de database/schema.sql.
const lock = async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72631,1)");
};

module.exports = { lock };
