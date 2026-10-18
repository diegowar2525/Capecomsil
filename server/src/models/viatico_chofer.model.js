const { createHttpError } = require("../utils/errors/http.error");

const configuracionModel = require("./configuracion_viatico.model");

const recalcular = async (client, idChofer, fecha) => {
    // El servicio mantiene el bloqueo transaccional compartido con remuneraciones.
    let diario = (
        await client.query(
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
        )
    ).rows[0];
    const { n } = (
        await client.query(
            `
        SELECT
            count(*)::int n
        FROM
            viaje
        WHERE
            id_chofer = $1
            AND fecha_inicio::date = $2
            AND estado = 'REGISTRADO'
    `,
            [idChofer, fecha]
        )
    ).rows[0];
    if (!diario && !n) return;
    if (!diario) {
        const config = await configuracionModel.findVigenteForShare(client, fecha);
        if (!config)
            throw createHttpError(
                "No existe configuración de viático vigente para la fecha del viaje",
                409
            );
        diario = (
            await client.query(
                `
        INSERT INTO
            viatico_chofer (id_chofer, id_configuracion_viatico, fecha, importe_diario_aplicado, total)
        VALUES
            ($1, $2, $3, $4, $4)
        RETURNING
            *
    `,
                [idChofer, config.id_configuracion_viatico, fecha, config.importe_diario]
            )
        ).rows[0];
    }
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
        [diario.id_viatico_chofer, n]
    );
    await client.query(
        `
        DELETE FROM costo_viaje c USING viaje v
        WHERE
            c.id_viaje = v.id_viaje
            AND c.id_viatico_chofer = $1
            AND v.estado = 'ANULADO'
    `,
        [diario.id_viatico_chofer]
    );
    if (!n) return;
    await client.query(
        `
        INSERT INTO
            costo_viaje (id_viaje, tipo_costo, valor, descripcion, id_viatico_chofer)
        SELECT
            id_viaje,
            'VIATICO',
            (
                div($3::numeric * 100, $4::int) + CASE
                    WHEN posicion <= mod($3::numeric * 100, $4::int) THEN 1
                    ELSE 0
                END
            ) / 100,
            'Asignación del viático diario',
            $5
        FROM
            (
                SELECT
                    id_viaje,
                    row_number() OVER (
                        ORDER BY
                            id_viaje
                    ) posicion
                FROM
                    viaje
                WHERE
                    id_chofer = $1
                    AND fecha_inicio::date = $2
                    AND estado = 'REGISTRADO'
            ) v
        ON CONFLICT (id_viaje, tipo_costo) DO UPDATE
        SET
            valor = EXCLUDED.valor
    `,
        [idChofer, fecha, diario.importe_diario_aplicado, n, diario.id_viatico_chofer]
    );
};

module.exports = {
    recalcular
};
