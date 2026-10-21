const pool = require("../config/database");

const create = async (client, id, data) => {
    const result = await client.query(
        `
        INSERT INTO
            tramo_viaje (
                id_viaje,
                orden,
                id_trayecto,
                kilometros,
                observacion,
                id_configuracion_peaje_trayecto,
                peaje_aplicado
            )
        VALUES
            ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            *
    `,
        [
            id,
            data.orden,
            data.id_trayecto,
            data.kilometros,
            data.observacion,
            data.id_configuracion_peaje_trayecto,
            data.peaje_aplicado
        ]
    );

    return result.rows[0] ?? null;
};

const findByViaje = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            t.*,
            c.nombre AS nombre_trayecto,
            c.id_terminal_origen,
            c.id_gasolinera_origen,
            c.id_terminal_destino,
            c.id_gasolinera_destino,
            COALESCE(tor.nombre, gor.nombre) AS nombre_origen,
            COALESCE(tde.nombre, gde.nombre) AS nombre_destino
        FROM
            tramo_viaje t
            JOIN trayecto c USING (id_trayecto)
            LEFT JOIN terminal tor ON tor.id_terminal = c.id_terminal_origen
            LEFT JOIN gasolinera gor ON gor.id_gasolinera = c.id_gasolinera_origen
            LEFT JOIN terminal tde ON tde.id_terminal = c.id_terminal_destino
            LEFT JOIN gasolinera gde ON gde.id_gasolinera = c.id_gasolinera_destino
        WHERE
            t.id_viaje = $1
        ORDER BY
            t.orden
    `,
        [id]
    );

    return result.rows;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `UPDATE tramo_viaje SET orden=$2, id_trayecto=$3, observacion=$4,
         id_configuracion_peaje_trayecto=$5, peaje_aplicado=$6
         WHERE id_tramo_viaje=$1 RETURNING *`,
        [id, data.orden, data.id_trayecto, data.observacion, data.id_configuracion_peaje_trayecto, data.peaje_aplicado]
    );
    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(`DELETE FROM tramo_viaje WHERE id_tramo_viaje=$1 RETURNING id_tramo_viaje`, [id]);
    return result.rows[0] ?? null;
};

module.exports = {
    update,
    remove,
    create,
    findByViaje
};
