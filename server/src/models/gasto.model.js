const pool = require("../config/database");

const select = `
        SELECT
            g.*, m.pago_directo_automatico, v.placa, p.nombre AS nombre_proveedor, CASE WHEN g.origen='OPERATIVO' THEN tg.nombre WHEN g.origen='VIATICO' THEN 'Desembolso de viático' WHEN g.origen='MANTENIMIENTO' THEN 'Mantenimiento / reparación' ELSE 'Combustible' END AS nombre_tipo_gasto,
            to_char(g.fecha, 'YYYY-MM-DD') AS fecha,
            to_char(g.fecha_anulacion, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_anulacion,
            a.id_abastecimiento_combustible
        FROM
            gasto g
            LEFT JOIN mantenimiento m ON m.id_mantenimiento = g.id_mantenimiento
            LEFT JOIN vehiculo v ON v.id_vehiculo = g.id_vehiculo
            LEFT JOIN proveedor p ON p.id_proveedor = g.id_proveedor
            LEFT JOIN tipo_gasto tg ON tg.id_tipo_gasto = g.id_tipo_gasto
            LEFT JOIN abastecimiento_combustible a ON a.id_gasto = g.id_gasto
    `;

const findAll = async (filtros, client = pool) => {
    const result = await client.query(
        `${select}
    WHERE ($1::int IS NULL OR g.id_vehiculo=$1) AND ($2::int IS NULL OR g.id_viaje=$2)
    AND ($3::int IS NULL OR g.id_proveedor=$3) AND ($4::int IS NULL OR g.id_viatico_chofer=$4)
    AND ($5::date IS NULL OR g.fecha >= $5) AND ($6::date IS NULL OR g.fecha <= $6)
    AND ($7::text IS NULL OR g.estado=$7) AND ($8::int IS NULL OR g.id_tipo_gasto=$8) AND ($11::text IS NULL OR g.origen=$11)
    ORDER BY g.fecha DESC,g.id_gasto DESC LIMIT $9 OFFSET $10`,
        [
            filtros.id_vehiculo,
            filtros.id_viaje,
            filtros.id_proveedor,
            filtros.id_viatico_chofer,
            filtros.fecha_desde,
            filtros.fecha_hasta,
            filtros.estado,
            filtros.id_tipo_gasto,
            filtros.limit,
            filtros.offset, filtros.origen
        ]
    );

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`${select} WHERE g.id_gasto=$1`, [id]);

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            gasto (
                id_viaje,
                id_vehiculo,
                id_proveedor,
                id_viatico_chofer,
                fecha,
                origen, id_tipo_gasto, id_mantenimiento,
                monto,
                descripcion,
                numero_comprobante,
                observacion
            )
        VALUES
            ($1, $2, $3, $4, $5, $6, $11, $12, $7, $8, $9, $10)
        RETURNING
            id_gasto
    `,
        [
            data.id_viaje,
            data.id_vehiculo,
            data.id_proveedor,
            data.id_viatico_chofer,
            data.fecha,
            data.origen,
            data.monto,
            data.descripcion,
            data.numero_comprobante,
            data.observacion, data.id_tipo_gasto ?? null, data.id_mantenimiento ?? null
        ]
    );

    return result.rows[0] ?? null;
};

const anular = async (client, id, motivo) => {
    const result = await client.query(
        `
        UPDATE gasto
        SET
            estado = 'ANULADO',
            fecha_anulacion = CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil',
            motivo_anulacion = $2
        WHERE
            id_gasto = $1
            AND estado = 'REGISTRADO'
        RETURNING
            id_gasto
    `,
        [id, motivo]
    );

    return result.rows[0] ?? null;
};

const referencias = async (client, data) => {
    const vehiculo = data.id_vehiculo
        ? (
              await client.query(
                  `
        SELECT
            id_vehiculo
        FROM
            vehiculo
        WHERE
            id_vehiculo = $1
        FOR SHARE
    `,
                  [data.id_vehiculo]
              )
          ).rows[0]
        : null;
    const proveedor = data.id_proveedor
        ? (
              await client.query(
                  `
        SELECT
            id_proveedor
        FROM
            proveedor
        WHERE
            id_proveedor = $1
        FOR SHARE
    `,
                  [data.id_proveedor]
              )
          ).rows[0]
        : null;
    const viaje = data.id_viaje
        ? (
              await client.query(
                  `
        SELECT
            id_vehiculo,
            estado
        FROM
            viaje
        WHERE
            id_viaje = $1
        FOR SHARE
    `,
                  [data.id_viaje]
              )
          ).rows[0]
        : null;
    const viatico = data.id_viatico_chofer
        ? (
              await client.query(
                  `
        SELECT
            id_viatico_chofer
        FROM
            viatico_chofer
        WHERE
            id_viatico_chofer = $1
        FOR SHARE
    `,
                  [data.id_viatico_chofer]
              )
          ).rows[0]
        : null;
    return {
        vehiculo,
        proveedor,
        viaje,
        viatico
    };
};

module.exports = {
    findAll,
    findById,
    create,
    anular,
    referencias
};
