const pool = require("../config/database");

// El servicio selecciona la configuración vigente; NUMERIC conserva el redondeo monetario.
const createCombustible = async (client, idViaje, config) => {
    await client.query(
        `
        INSERT INTO
            costo_viaje (
                id_viaje,
                tipo_costo,
                valor,
                descripcion,
                id_configuracion_combustible,
                kilometros_aplicados,
                consumo_galones_km_aplicado,
                precio_por_galon_aplicado,
                galones_estimados
            )
        SELECT
            $1,
            'COMBUSTIBLE',
            round(round(sum(kilometros) * $3::numeric, 6) * $4::numeric, 2),
            'Combustible estimado del recorrido',
            $2,
            sum(kilometros),
            $3,
            $4,
            round(sum(kilometros) * $3::numeric, 6)
        FROM
            tramo_viaje
        WHERE
            id_viaje = $1
    `,
        [
            idViaje,
            config.id_configuracion_combustible,
            config.consumo_galones_km,
            config.precio_por_galon
        ]
    );
};

const createPeaje = async (client, idViaje) => {
    await client.query(
        `
        INSERT INTO
            costo_viaje (id_viaje, tipo_costo, valor, descripcion)
        SELECT
            $1,
            'PEAJE',
            sum(peaje_aplicado),
            'Peajes del recorrido'
        FROM
            tramo_viaje
        WHERE
            id_viaje = $1
    `,
        [idViaje]
    );
};

const removeViaticosDeViajesAnulados = async (client, idViaticoChofer) => {
    await client.query(
        `
        DELETE FROM costo_viaje c USING viaje v
        WHERE
            c.id_viaje = v.id_viaje
            AND c.id_viatico_chofer = $1
            AND v.estado = 'ANULADO'
    `,
        [idViaticoChofer]
    );
};

// Reparte centavos en SQL usando el importe histórico del viático diario.
const asignarViaticoDiario = async (client, idChofer, fecha, diario, cantidadViajes) => {
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
        [
            idChofer,
            fecha,
            diario.importe_diario_aplicado,
            cantidadViajes,
            diario.id_viatico_chofer
        ]
    );
};

const findByViaje = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            costo_viaje
        WHERE
            id_viaje = $1
        ORDER BY
            id_costo
    `,
        [id]
    );

    return result.rows;
};

module.exports = {
    createCombustible,
    createPeaje,
    removeViaticosDeViajesAnulados,
    asignarViaticoDiario,
    findByViaje
};
