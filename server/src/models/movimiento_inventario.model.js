const createEntrada = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO movimiento_inventario (
            id_producto,
            fecha,
            tipo_movimiento,
            cantidad,
            motivo,
            id_detalle_recepcion_compra
        )
        VALUES ($1, $2, 'ENTRADA', $3, 'Recepción de compra', $4)
        RETURNING *
        `,
        [
            data.id_producto,
            data.fecha,
            data.cantidad,
            data.id_detalle_recepcion_compra
        ]
    );

    return result.rows[0];
};

// El servicio debe bloquear primero la fila del producto (FOR UPDATE).
const getDisponibilidad = async (client, id, cantidad) => {
    const result = await client.query(
        `
        SELECT saldo::text AS stock, saldo >= $2::numeric AS suficiente
        FROM (
            SELECT COALESCE(SUM(
                CASE WHEN tipo_movimiento = 'SALIDA' THEN -cantidad ELSE cantidad END
            ), 0) AS saldo
            FROM movimiento_inventario
            WHERE id_producto = $1
        ) inventario
        `,
        [id, cantidad]
    );

    return result.rows[0];
};

const createSalida = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO movimiento_inventario (
            id_producto, fecha, tipo_movimiento, cantidad, motivo, id_detalle_mantenimiento
        )
        VALUES ($1, $2, 'SALIDA', $3, 'Consumo por mantenimiento', $4)
        RETURNING *
        `,
        [data.id_producto, data.fecha, data.cantidad, data.id_detalle_mantenimiento]
    );

    return result.rows[0];
};

module.exports = {
    createEntrada,
    getDisponibilidad,
    createSalida
};
