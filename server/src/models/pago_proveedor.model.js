const pool = require("../config/database");

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            p.*, f.id_proveedor, f.numero_factura, pr.nombre AS nombre_proveedor
        FROM
            pago_proveedor p
            JOIN factura_proveedor f USING (id_factura_proveedor)
            JOIN proveedor pr ON pr.id_proveedor = f.id_proveedor
        WHERE
            id_pago_proveedor = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `
        SELECT
            p.*,
            f.id_proveedor,
            f.numero_factura, pr.nombre AS nombre_proveedor
        FROM
            pago_proveedor p
            JOIN factura_proveedor f USING (id_factura_proveedor)
            JOIN proveedor pr ON pr.id_proveedor = f.id_proveedor
        WHERE
            (
                $1::integer IS NULL
                OR p.id_factura_proveedor = $1
            )
            AND (
                $2::integer IS NULL
                OR f.id_proveedor = $2
            )
            AND (
                $3::date IS NULL
                OR p.fecha_pago >= $3
            )
            AND (
                $4::date IS NULL
                OR p.fecha_pago <= $4
            )
            AND (
                $5::text IS NULL
                OR p.estado = $5
            )
        ORDER BY
            p.fecha_pago DESC,
            p.id_pago_proveedor DESC
        LIMIT
            $6
        OFFSET
            $7
    `,
        [
            filtros.id_factura_proveedor,
            filtros.id_proveedor,
            filtros.fecha_desde,
            filtros.fecha_hasta,
            filtros.estado,
            filtros.limit,
            filtros.offset
        ]
    );

    return result.rows;
};

// El servicio bloquea primero la factura; todos los pagos comparten ese bloqueo.

// El servicio bloquea primero la factura; todos los pagos comparten ese bloqueo.
const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            pago_proveedor (
                id_factura_proveedor,
                fecha_pago,
                monto,
                forma_pago,
                numero_cheque,
                numero_comprobante,
                observacion
            )
        SELECT
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
        FROM
            factura_proveedor f
        WHERE
            f.id_factura_proveedor = $1
            AND f.estado <> 'ANULADA'
            AND $3::numeric <= f.total - (
                SELECT
                    COALESCE(SUM(monto), 0)
                FROM
                    pago_proveedor
                WHERE
                    id_factura_proveedor = $1
                    AND estado = 'REGISTRADO'
            )
        RETURNING
            *
    `,
        [
            data.id_factura_proveedor,
            data.fecha_pago,
            data.monto,
            data.forma_pago,
            data.numero_cheque,
            data.numero_comprobante,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const anular = async (client, id, motivo) => {
    const result = await client.query(
        `
        UPDATE pago_proveedor
        SET
            estado = 'ANULADO',
            fecha_anulacion = CURRENT_TIMESTAMP,
            motivo_anulacion = $2
        WHERE
            id_pago_proveedor = $1
            AND estado = 'REGISTRADO'
        RETURNING
            *
    `,
        [id, motivo]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findById,
    findAll,
    create,
    anular
};
