const pool = require("../config/database");

const consulta = `SELECT t.*, COALESCE(tor.nombre, gor.nombre) AS nombre_origen,
    COALESCE(tde.nombre, gde.nombre) AS nombre_destino
    FROM trayecto t
    LEFT JOIN terminal tor ON tor.id_terminal=t.id_terminal_origen
    LEFT JOIN gasolinera gor ON gor.id_gasolinera=t.id_gasolinera_origen
    LEFT JOIN terminal tde ON tde.id_terminal=t.id_terminal_destino
    LEFT JOIN gasolinera gde ON gde.id_gasolinera=t.id_gasolinera_destino`;

const findAll = async () => {
    return (await pool.query(`${consulta} ORDER BY t.id_trayecto`)).rows;
};

const findById = async (id) => {
    return (await pool.query(`${consulta} WHERE t.id_trayecto=$1`, [id])).rows[0];
};

const create = async (data) => {
    return (await pool.query(`INSERT INTO trayecto
        (nombre,id_terminal_origen,id_gasolinera_origen,id_terminal_destino,id_gasolinera_destino,kilometros,estado,observacion)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [data.nombre, data.id_terminal_origen, data.id_gasolinera_origen,
            data.id_terminal_destino, data.id_gasolinera_destino, data.kilometros, data.estado, data.observacion])).rows[0];
};

const update = async (id, data) => {
    return (await pool.query(`UPDATE trayecto SET nombre=$1,id_terminal_origen=$2,id_gasolinera_origen=$3,
        id_terminal_destino=$4,id_gasolinera_destino=$5,kilometros=$6,estado=$7,observacion=$8
        WHERE id_trayecto=$9 RETURNING *`,
        [data.nombre, data.id_terminal_origen, data.id_gasolinera_origen,
            data.id_terminal_destino, data.id_gasolinera_destino, data.kilometros, data.estado, data.observacion, id])).rows[0];
};

const remove = async (id) => {
    return (await pool.query("DELETE FROM trayecto WHERE id_trayecto=$1 RETURNING *", [id])).rows[0];
};

const findByIdForShare = async (client, id) => {
    return (await client.query("SELECT * FROM trayecto WHERE id_trayecto=$1 FOR SHARE", [id])).rows[0];
};

module.exports = { findAll, findById, create, update, remove, findByIdForShare };
