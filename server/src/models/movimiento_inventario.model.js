const pool = require("../config/database");

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

const findAll = async (filtros) => {
    const result = await pool.query(
        `
        SELECT m.*, p.nombre AS nombre_producto, p.unidad_medida,
            dm.id_mantenimiento, dr.id_recepcion_compra,
            r.id_factura_proveedor
        FROM movimiento_inventario m
        JOIN producto p USING (id_producto)
        LEFT JOIN detalle_mantenimiento dm USING (id_detalle_mantenimiento)
        LEFT JOIN detalle_recepcion_compra dr USING (id_detalle_recepcion_compra)
        LEFT JOIN recepcion_compra r USING (id_recepcion_compra)
        WHERE ($1::integer IS NULL OR m.id_producto = $1)
            AND ($2::date IS NULL OR m.fecha >= $2::date)
            AND ($3::date IS NULL OR m.fecha < $3::date + INTERVAL '1 day')
            AND ($4::text IS NULL OR m.tipo_movimiento = $4)
        ORDER BY m.fecha DESC, m.id_movimiento DESC
        LIMIT $5 OFFSET $6
        `,
        [filtros.id_producto, filtros.fecha_desde, filtros.fecha_hasta,
            filtros.tipo_movimiento, filtros.limit, filtros.offset]
    );

    return result.rows;
};

const createAjuste = async (client, data) => {
    // La fila del producto debe estar bloqueada por el servicio.
    const result = await client.query(
        `
        INSERT INTO movimiento_inventario (
            id_producto, fecha, tipo_movimiento, cantidad, motivo, observacion
        )
        SELECT $1, $2, 'AJUSTE', $3, $4, $5
        WHERE (
            SELECT COALESCE(SUM(
                CASE WHEN tipo_movimiento = 'SALIDA' THEN -cantidad ELSE cantidad END
            ), 0) FROM movimiento_inventario WHERE id_producto = $1
        ) + $3::numeric >= 0
        RETURNING *
        `,
        [data.id_producto, data.fecha, data.cantidad, data.motivo, data.observacion]
    );

    return result.rows[0];
};

const findForUpdate = async (client, id) => {
    return (await client.query("SELECT * FROM movimiento_inventario WHERE id_movimiento=$1 FOR UPDATE", [id])).rows[0];
};

const findByRecepcion = async (client, id) => {
    return (await client.query(`SELECT m.* FROM movimiento_inventario m
        JOIN detalle_recepcion_compra d USING (id_detalle_recepcion_compra)
        WHERE d.id_recepcion_compra=$1 ORDER BY m.id_producto, m.id_movimiento`, [id])).rows;
};

const findByMantenimiento = async (client, id) => {
    return (await client.query(`SELECT m.* FROM movimiento_inventario m
        JOIN detalle_mantenimiento d USING (id_detalle_mantenimiento)
        WHERE d.id_mantenimiento=$1 ORDER BY m.id_producto, m.id_movimiento`, [id])).rows;
};

const hasReversion = async (client, id) => {
    return (await client.query("SELECT 1 FROM movimiento_inventario WHERE id_movimiento_revertido=$1", [id])).rowCount > 0;
};

const createReversion = async (client, id, motivo) => {
    return (await client.query(`
        INSERT INTO movimiento_inventario(id_producto, tipo_movimiento, cantidad, motivo, id_movimiento_revertido)
        SELECT m.id_producto,
            CASE m.tipo_movimiento WHEN 'ENTRADA' THEN 'SALIDA' WHEN 'SALIDA' THEN 'ENTRADA' ELSE 'AJUSTE' END,
            CASE WHEN m.tipo_movimiento='AJUSTE' THEN -m.cantidad ELSE m.cantidad END, $2, m.id_movimiento
        FROM movimiento_inventario m WHERE m.id_movimiento=$1
        AND (SELECT COALESCE(SUM(CASE WHEN s.tipo_movimiento='SALIDA' THEN -s.cantidad ELSE s.cantidad END),0)
             FROM movimiento_inventario s WHERE s.id_producto=m.id_producto)
            + CASE WHEN m.tipo_movimiento='SALIDA' THEN m.cantidad ELSE -m.cantidad END >= 0
        RETURNING *`, [id, motivo])).rows[0];
};

module.exports = {
    findForUpdate,
    findByRecepcion,
    findByMantenimiento,
    hasReversion,
    createReversion,
    findAll,
    createAjuste,
    createEntrada,
    getDisponibilidad,
    createSalida
};
