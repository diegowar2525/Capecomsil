const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(`
        SELECT mantenimiento.*, vehiculo.placa, proveedor.nombre AS nombre_proveedor
        FROM mantenimiento
        JOIN vehiculo USING (id_vehiculo)
        LEFT JOIN proveedor USING (id_proveedor)
        ORDER BY id_mantenimiento DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT mantenimiento.*, vehiculo.placa, proveedor.nombre AS nombre_proveedor
        FROM mantenimiento
        JOIN vehiculo USING (id_vehiculo)
        LEFT JOIN proveedor USING (id_proveedor)
        WHERE id_mantenimiento = $1
        `,
        [id]
    );

    return result.rows[0];
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO mantenimiento (
            id_vehiculo, id_proveedor, fecha, tipo, monto, descripcion, observacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [data.id_vehiculo, data.id_proveedor, data.fecha, data.tipo,
        data.monto, data.descripcion, data.observacion]
    );

    return result.rows[0];
};

module.exports = {
    findAll,
    findById,
    create
};
