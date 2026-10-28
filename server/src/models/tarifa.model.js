const pool = require("../config/database");

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado,
            (SELECT nombre FROM gasolinera g WHERE g.id_gasolinera=tarifa.id_gasolinera) AS nombre_gasolinera,
            (SELECT nombre FROM terminal t WHERE t.id_terminal=tarifa.id_terminal) AS nombre_terminal
        FROM
            tarifa
        ORDER BY
            id_tarifa DESC
    `);

    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado,
            (SELECT nombre FROM gasolinera g WHERE g.id_gasolinera=tarifa.id_gasolinera) AS nombre_gasolinera,
            (SELECT nombre FROM terminal t WHERE t.id_terminal=tarifa.id_terminal) AS nombre_terminal
        FROM
            tarifa
        WHERE
            id_tarifa = $1
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const create = async (
    { id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado },
    client = pool
) => {
    const result = await client.query(
        `
        INSERT INTO
            tarifa (id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado)
        VALUES
            ($1, $2, $3, $4, $5, $6)
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
    `,
        [id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado]
    );

    return result.rows[0] ?? null;
};

const update = async (
    id,
    { id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado },
    client = pool
) => {
    const result = await client.query(
        `
        UPDATE tarifa
        SET
            id_gasolinera = $1,
            id_terminal = $2,
            valor_por_galon = $3,
            fecha_inicio = $4,
            fecha_fin = $5,
            estado = $6
        WHERE
            id_tarifa = $7
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
    `,
        [id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado, id]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM tarifa
        WHERE
            id_tarifa = $1
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

const findVigenteForUpdate = async (client, idGasolinera, idTerminal, fecha) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            tarifa
        WHERE
            id_gasolinera = $1
            AND id_terminal = $2
            AND fecha_inicio <= $3::date
            AND (
                fecha_fin IS NULL
                OR fecha_fin >= $3::date
            )
        ORDER BY
            id_tarifa
        FOR UPDATE
    `,
        [idGasolinera, idTerminal, fecha]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findVigenteForUpdate,
    findAll,
    findById,
    create,
    update,
    remove
};
