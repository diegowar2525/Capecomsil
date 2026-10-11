const pool = require("../config/database");

const create = async (client, id, data) => {
    return (await client.query(`INSERT INTO tramo_viaje
        (id_viaje, orden, id_terminal_origen, id_gasolinera_origen,
        id_terminal_destino, id_gasolinera_destino, kilometros, observacion)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id, data.orden, data.id_terminal_origen, data.id_gasolinera_origen,
            data.id_terminal_destino, data.id_gasolinera_destino, data.kilometros, data.observacion])).rows[0];
};

const findByViaje = async (id, client = pool) => {
    return (await client.query(`SELECT t.*,
        COALESCE(tor.nombre, gor.nombre) AS nombre_origen,
        COALESCE(tde.nombre, gde.nombre) AS nombre_destino
        FROM tramo_viaje t
        LEFT JOIN terminal tor ON tor.id_terminal=t.id_terminal_origen
        LEFT JOIN gasolinera gor ON gor.id_gasolinera=t.id_gasolinera_origen
        LEFT JOIN terminal tde ON tde.id_terminal=t.id_terminal_destino
        LEFT JOIN gasolinera gde ON gde.id_gasolinera=t.id_gasolinera_destino
        WHERE t.id_viaje=$1 ORDER BY t.orden`, [id])).rows;
};

module.exports = { create, findByViaje };
