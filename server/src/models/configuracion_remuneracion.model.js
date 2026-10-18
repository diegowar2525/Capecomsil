const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
        FROM
            configuracion_remuneracion
        ORDER BY
            configuracion_remuneracion.fecha_inicio DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
        FROM
            configuracion_remuneracion
        WHERE
            id_configuracion_remuneracion = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO
            configuracion_remuneracion (importe_diario, adicional_dia_especial, fecha_inicio, fecha_fin, observacion)
        VALUES
            ($1, $2, $3, $4, $5)
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [
            data.importe_diario,
            data.adicional_dia_especial,
            data.fecha_inicio,
            data.fecha_fin,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const update = async (client, id, data) => {
    const result = await client.query(
        `
        UPDATE configuracion_remuneracion
        SET
            importe_diario = $2,
            adicional_dia_especial = $3,
            fecha_inicio = $4,
            fecha_fin = $5,
            observacion = $6
        WHERE
            id_configuracion_remuneracion = $1
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [
            id,
            data.importe_diario,
            data.adicional_dia_especial,
            data.fecha_inicio,
            data.fecha_fin,
            data.observacion
        ]
    );

    return result.rows[0] ?? null;
};

const remove = async (client, id) => {
    const result = await client.query(
        `
        DELETE FROM configuracion_remuneracion
        WHERE
            id_configuracion_remuneracion = $1
        RETURNING
            *,
            fecha_inicio::text AS fecha_inicio,
            fecha_fin::text AS fecha_fin
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
