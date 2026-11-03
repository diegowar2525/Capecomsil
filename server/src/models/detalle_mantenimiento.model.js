const pool = require("../config/database");

const findByMantenimiento = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            detalle_mantenimiento.*,
            producto.nombre AS nombre_producto,
            producto.unidad_medida,
            producto.medida,
            producto.condicion_llanta
        FROM
            detalle_mantenimiento
            LEFT JOIN producto USING (id_producto)
        WHERE
            id_mantenimiento = $1 AND vigente
        ORDER BY
            id_detalle_mantenimiento
    `,
        [id]
    );

    return result.rows;
};

module.exports = { findByMantenimiento };
