const pool = require("../config/database");

const findByMantenimiento = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT detalle_mantenimiento.*, producto.nombre AS nombre_producto,
            producto.unidad_medida
        FROM detalle_mantenimiento
        JOIN producto USING (id_producto)
        WHERE id_mantenimiento = $1
        ORDER BY id_detalle_mantenimiento
        `,
        [id]
    );

    return result.rows;
};

const create = async (client, id, data) => {
    const result = await client.query(
        `
        INSERT INTO detalle_mantenimiento (
            id_mantenimiento, id_producto, cantidad, observacion
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [id, data.id_producto, data.cantidad, data.observacion]
    );

    return result.rows[0];
};

module.exports = {
    findByMantenimiento,
    create
};
