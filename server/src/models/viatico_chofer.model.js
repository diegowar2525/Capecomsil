const findByChoferFechaForUpdate = async (client, idChofer, fecha) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            viatico_chofer
        WHERE
            id_chofer = $1
            AND fecha = $2
        FOR UPDATE
    `,
        [idChofer, fecha]
    );

    return result.rows[0] ?? null;
};

const create = async (client, idChofer, fecha, config) => {
    const result = await client.query(
        `
        INSERT INTO
            viatico_chofer (id_chofer, id_configuracion_viatico, fecha, importe_diario_aplicado, total)
        VALUES
            ($1, $2, $3, $4, $4)
        RETURNING
            *
    `,
        [idChofer, config.id_configuracion_viatico, fecha, config.importe_diario]
    );

    return result.rows[0] ?? null;
};

const updateTotalPorViajes = async (client, idViaticoChofer, cantidadViajes) => {
    await client.query(
        `
        UPDATE viatico_chofer
        SET
            total = CASE
                WHEN $2::int > 0 THEN importe_diario_aplicado
                ELSE 0
            END
        WHERE
            id_viatico_chofer = $1
    `,
        [idViaticoChofer, cantidadViajes]
    );
};

module.exports = {
    findByChoferFechaForUpdate,
    create,
    updateTotalPorViajes
};
