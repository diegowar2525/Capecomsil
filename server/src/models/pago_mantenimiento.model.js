const pool = require("../config/database");

const findByMantenimiento = async (id, client = pool) => {
    const result = await client.query(`SELECT g.*,to_char(fecha,'YYYY-MM-DD') AS fecha
        FROM gasto g WHERE id_mantenimiento=$1 ORDER BY id_gasto DESC`, [id]);
    return result.rows;
};

const resumen = async (id, client = pool) => {
    const result = await client.query(`SELECT COALESCE(sum(g.monto) FILTER(WHERE g.estado='REGISTRADO'),0)::text AS total_pagado,
        (m.monto-COALESCE(sum(g.monto) FILTER(WHERE g.estado='REGISTRADO'),0))::text AS saldo_pendiente
        FROM mantenimiento m LEFT JOIN gasto g USING(id_mantenimiento)
        WHERE m.id_mantenimiento=$1 GROUP BY m.id_mantenimiento`, [id]);
    return result.rows[0] ?? null;
};
module.exports = { findByMantenimiento, resumen };
