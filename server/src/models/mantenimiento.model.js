const pool = require("../config/database");

const fechas = `to_char(fecha_inicio,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
    to_char(fecha_fin,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin`;

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT mantenimiento.*, ${fechas}, vehiculo.placa, proveedor.nombre AS nombre_proveedor
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
        SELECT mantenimiento.*, ${fechas}, vehiculo.placa, proveedor.nombre AS nombre_proveedor
        FROM mantenimiento
        JOIN vehiculo USING (id_vehiculo)
        LEFT JOIN proveedor USING (id_proveedor)
        WHERE id_mantenimiento = $1
        `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO mantenimiento (
            id_vehiculo, id_proveedor, fecha_inicio, fecha_fin, tipo, monto, descripcion, observacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *, ${fechas}
        `,
        [
            data.id_vehiculo,
            data.id_proveedor,
            data.fecha_inicio,
            data.fecha_fin,
            data.tipo,
            data.monto,
            data.descripcion,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(
        `SELECT *, ${fechas} FROM mantenimiento WHERE id_mantenimiento=$1 FOR UPDATE`,
        [id]
    );

    return result.rows[0] ?? null;
};

const anular = async (client, id, motivo) => {
    const result = await client.query(
        `UPDATE mantenimiento SET estado='ANULADO', fecha_anulacion=CURRENT_TIMESTAMP, motivo_anulacion=$2 WHERE id_mantenimiento=$1 RETURNING *, ${fechas}`,
        [id, motivo]
    );

    return result.rows[0] ?? null;
};

const finalizar = async (client, id, fecha) => {
    const result = await client.query(
        `UPDATE mantenimiento SET fecha_fin=$2 WHERE id_mantenimiento=$1 RETURNING *, ${fechas}`,
        [id, fecha]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    finalizar,
    findByIdForUpdate,
    anular,
    findAll,
    findById,
    create
};
