const pool = require("../config/database");

const create = async (client, id, data) => {
    return (await client.query(`INSERT INTO tramo_viaje
        (id_viaje, orden, id_trayecto, kilometros, observacion)
        VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, data.orden, data.id_trayecto, data.kilometros, data.observacion])).rows[0];
};

const findByViaje = async (id, client = pool) => {
    return (await client.query(`SELECT t.*, c.nombre AS nombre_trayecto,
        c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino,
        COALESCE(tor.nombre, gor.nombre) AS nombre_origen,
        COALESCE(tde.nombre, gde.nombre) AS nombre_destino
        FROM tramo_viaje t
        JOIN trayecto c USING (id_trayecto)
        LEFT JOIN terminal tor ON tor.id_terminal=c.id_terminal_origen
        LEFT JOIN gasolinera gor ON gor.id_gasolinera=c.id_gasolinera_origen
        LEFT JOIN terminal tde ON tde.id_terminal=c.id_terminal_destino
        LEFT JOIN gasolinera gde ON gde.id_gasolinera=c.id_gasolinera_destino
        WHERE t.id_viaje=$1 ORDER BY t.orden`, [id])).rows;
};

module.exports = { create, findByViaje };
