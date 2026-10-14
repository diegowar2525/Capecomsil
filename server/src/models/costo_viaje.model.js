const pool = require("../config/database");

const findByViaje = async (id, client = pool) => {
    return (await client.query("SELECT * FROM costo_viaje WHERE id_viaje=$1 ORDER BY id_costo", [id])).rows;
};

module.exports = { findByViaje };
