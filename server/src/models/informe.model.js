const pool = require("../config/database");

// Las agregaciones se hacen por separado para no multiplicar detalles, costos y gastos.

// Las agregaciones se hacen por separado para no multiplicar detalles, costos y gastos.
const viajesPeriodo = `viajes_periodo AS (
    SELECT * FROM viaje WHERE estado='REGISTRADO'
    AND fecha_inicio >= $1::date AND fecha_inicio < $2::date + INTERVAL '1 day'
    AND ($3::int IS NULL OR id_vehiculo=$3)
)`;

const viajes = async (filtros, client = pool) => {
    const result = await client.query(
        `WITH ${viajesPeriodo}
    SELECT v.id_viaje,v.id_vehiculo,ve.placa,v.id_chofer,
        to_char(v.fecha_inicio,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
        to_char(v.fecha_fin,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin,
        COALESCE(d.ingreso,0)::text AS ingreso_transporte,
        COALESCE(c.total,0)::text AS costo_estimado_total,
        (COALESCE(d.ingreso,0)-COALESCE(c.total,0))::text AS margen_estimado,
        c.combustible::text AS combustible_estimado,c.chofer::text AS chofer_estimado,
        c.viatico::text AS viatico_estimado,c.peaje::text AS peaje_estimado,
        COALESCE(g.total,0)::text AS gastos_directos_registrados,
        g.peaje::text AS peaje_real_registrado,
        (g.peaje-c.peaje)::text AS diferencia_peaje,
        round((g.peaje-c.peaje)*100/NULLIF(c.peaje,0),2)::text AS diferencia_peaje_porcentaje,
        CASE WHEN g.peaje IS NULL THEN 'SIN_GASTOS_REGISTRADOS'
            WHEN c.peaje IS NULL THEN 'SIN_ESTIMACION' ELSE 'COMPARACION_PARCIAL' END AS estado_comparacion_peaje,
        NULL::text AS margen_real, count(*) OVER()::int AS total_registros
    FROM viajes_periodo v JOIN vehiculo ve USING(id_vehiculo)
    LEFT JOIN LATERAL (SELECT sum(valor_transporte) ingreso FROM detalle_viaje WHERE id_viaje=v.id_viaje) d ON true
    LEFT JOIN LATERAL (SELECT sum(valor) total,
        sum(valor) FILTER (WHERE tipo_costo='COMBUSTIBLE') combustible,
        sum(valor) FILTER (WHERE tipo_costo='CHOFER') chofer,
        sum(valor) FILTER (WHERE tipo_costo='VIATICO') viatico,
        sum(valor) FILTER (WHERE tipo_costo='PEAJE') peaje FROM costo_viaje WHERE id_viaje=v.id_viaje) c ON true
    LEFT JOIN LATERAL (SELECT sum(monto) total,sum(monto) FILTER (WHERE tipo_gasto='PEAJE') peaje
        FROM gasto WHERE id_viaje=v.id_viaje AND estado='REGISTRADO') g ON true
    ORDER BY v.fecha_inicio DESC,v.id_viaje DESC LIMIT $4 OFFSET $5`,
        [
            filtros.fecha_desde,
            filtros.fecha_hasta,
            filtros.id_vehiculo,
            filtros.limit,
            filtros.offset
        ]
    );

    return result.rows;
};

const resumen = async (filtros, client = pool) => {
    const result = await client.query(
        `WITH ${viajesPeriodo},
    gastos_periodo AS (SELECT * FROM gasto WHERE estado='REGISTRADO' AND fecha BETWEEN $1 AND $2
        AND ($3::int IS NULL OR id_vehiculo=$3)),
    estimados AS (SELECT c.tipo_costo,sum(c.valor) monto FROM costo_viaje c JOIN viajes_periodo v USING(id_viaje) GROUP BY c.tipo_costo),
    reales AS (SELECT tipo_gasto,sum(monto) monto,count(*)::int cantidad FROM gastos_periodo GROUP BY tipo_gasto),
    conceptos AS (SELECT tipo_costo AS tipo FROM estimados UNION SELECT tipo_gasto FROM reales),
    ingresos AS (SELECT COALESCE(sum(d.valor_transporte),0) total FROM detalle_viaje d JOIN viajes_periodo v USING(id_viaje)),
    costos AS (SELECT COALESCE(sum(monto),0) total FROM estimados)
    SELECT (SELECT count(*)::int FROM viajes_periodo) AS cantidad_viajes,
        ingresos.total::text AS ingreso_transporte,costos.total::text AS costo_estimado_viajes,
        (ingresos.total-costos.total)::text AS margen_estimado_viajes,
        (SELECT COALESCE(sum(monto),0)::text FROM gastos_periodo) AS gastos_registrados_periodo,
        (SELECT COALESCE(sum(monto),0)::text FROM gastos_periodo WHERE id_viaje IS NULL) AS gastos_sin_viaje,
        (SELECT COALESCE(sum(monto),0)::text FROM gastos_periodo WHERE id_vehiculo IS NULL) AS gastos_sin_vehiculo,
        (SELECT COALESCE(sum(g.monto),0)::text FROM gastos_periodo g JOIN viaje v USING(id_viaje)
            WHERE v.estado='ANULADO') AS gastos_de_viajes_anulados,
        CASE WHEN $3::int IS NULL THEN (SELECT COALESCE(sum(r.total-COALESCE(a.total,0)),0)::text
            FROM remuneracion_chofer r LEFT JOIN LATERAL (SELECT sum(c.valor) total FROM costo_viaje c
                JOIN viaje v USING(id_viaje) WHERE c.id_remuneracion_chofer=r.id_remuneracion_chofer
                AND v.estado='REGISTRADO') a ON true WHERE r.fecha BETWEEN $1 AND $2)
            ELSE NULL END AS remuneracion_generada_sin_viajes,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('tipo',t.tipo,'estimado',e.monto::text,
            'gasto_registrado',r.monto::text,'cantidad_gastos',COALESCE(r.cantidad,0),
            'diferencia_desembolso_estimado',(r.monto-e.monto)::text) ORDER BY t.tipo)
            FROM conceptos t LEFT JOIN estimados e ON e.tipo_costo=t.tipo LEFT JOIN reales r ON r.tipo_gasto=t.tipo),'[]'::jsonb) AS conceptos
    FROM ingresos CROSS JOIN costos`,
        [filtros.fecha_desde, filtros.fecha_hasta, filtros.id_vehiculo]
    );

    return result.rows[0] ?? null;
};

// El gasto se asocia al día del viático aunque el desembolso se registre después.

// El gasto se asocia al día del viático aunque el desembolso se registre después.
const viaticos = async (filtros, client = pool) => {
    const result = await client.query(
        `
        SELECT
            vc.id_viatico_chofer,
            vc.id_chofer,
            ch.nombre,
            to_char(vc.fecha, 'YYYY-MM-DD') AS fecha,
            vc.total::text AS estimado,
            g.total::text AS gasto_real_registrado,
            COALESCE(g.cantidad, 0) AS cantidad_gastos,
            (g.total - vc.total)::text AS diferencia,
            round((g.total - vc.total) * 100 / NULLIF(vc.total, 0), 2)::text AS diferencia_porcentaje,
            CASE
                WHEN g.total IS NULL THEN 'SIN_GASTOS_REGISTRADOS'
                ELSE 'COMPARACION_PARCIAL'
            END AS estado_comparacion,
            count(*) OVER ()::int AS total_registros
        FROM
            viatico_chofer vc
            JOIN chofer ch USING (id_chofer)
            LEFT JOIN LATERAL (
                SELECT
                    sum(monto) total,
                    count(*)::int cantidad
                FROM
                    gasto
                WHERE
                    id_viatico_chofer = vc.id_viatico_chofer
                    AND estado = 'REGISTRADO'
            ) g ON true
        WHERE
            vc.fecha BETWEEN $1 AND $2
            AND (
                $3::int IS NULL
                OR vc.id_chofer = $3
            )
        ORDER BY
            vc.fecha DESC,
            vc.id_viatico_chofer DESC
        LIMIT
            $4
        OFFSET
            $5
    `,
        [filtros.fecha_desde, filtros.fecha_hasta, filtros.id_chofer, filtros.limit, filtros.offset]
    );

    return result.rows;
};

const combustible = async (filtros, client = pool) => {
    const result = await client.query(
        `
        WITH
            cargas AS (
                SELECT
                    a.*,
                    g.monto
                FROM
                    abastecimiento_combustible a
                    JOIN gasto g USING (id_gasto)
                WHERE
                    g.estado = 'REGISTRADO'
                    AND (
                        $3::int IS NULL
                        OR a.id_vehiculo = $3
                    )
                    AND a.fecha_hora < $2::date + INTERVAL '1 day'
            ),
            completas AS (
                SELECT
                    a.*,
                    lag(id_abastecimiento_combustible) OVER w AS id_inicio,
                    lag(fecha_hora) OVER w AS inicio,
                    lag(kilometraje_odometro) OVER w AS odometro_inicio
                FROM
                    cargas a
                WHERE
                    tanque_lleno
                WINDOW
                    w AS (
                        PARTITION BY
                            id_vehiculo
                        ORDER BY
                            fecha_hora,
                            id_abastecimiento_combustible
                    )
            ),
            intervalos AS (
                SELECT
                    a.*,
                    a.kilometraje_odometro - a.odometro_inicio AS kilometros_odometro,
                    s.galones_consumidos,
                    s.importe_cargas,
                    s.cantidad_cargas,
                    t.kilometros_viajes,
                    t.galones_estimados_viajes,
                    t.viajes_completos,
                    t.viajes_sin_estimacion,
                    (
                        SELECT
                            count(*)::int
                        FROM
                            viaje v
                        WHERE
                            v.id_vehiculo = a.id_vehiculo
                            AND v.estado = 'REGISTRADO'
                            AND v.fecha_inicio < a.fecha_hora
                            AND v.fecha_fin > a.inicio
                            AND (
                                v.fecha_inicio < a.inicio
                                OR v.fecha_fin > a.fecha_hora
                            )
                    ) AS viajes_cruzan_limites
                FROM
                    completas a
                    LEFT JOIN LATERAL (
                        SELECT
                            sum(c.galones) galones_consumidos,
                            sum(c.monto) importe_cargas,
                            count(*)::int cantidad_cargas
                        FROM
                            cargas c
                        WHERE
                            c.id_vehiculo = a.id_vehiculo
                            AND c.fecha_hora > a.inicio
                            AND c.fecha_hora <= a.fecha_hora
                    ) s ON true
                    LEFT JOIN LATERAL (
                        SELECT
                            sum(c.kilometros_aplicados) kilometros_viajes,
                            sum(c.galones_estimados) galones_estimados_viajes,
                            count(*)::int viajes_completos,
                            count(*) FILTER (
                                WHERE
                                    c.id_costo IS NULL
                            )::int viajes_sin_estimacion
                        FROM
                            viaje v
                            LEFT JOIN costo_viaje c ON c.id_viaje = v.id_viaje
                            AND c.tipo_costo = 'COMBUSTIBLE'
                        WHERE
                            v.id_vehiculo = a.id_vehiculo
                            AND v.estado = 'REGISTRADO'
                            AND v.fecha_inicio >= a.inicio
                            AND v.fecha_fin <= a.fecha_hora
                    ) t ON true
                WHERE
                    a.fecha_hora >= $1::date
            ),
            medidas AS (
                SELECT
                    *,
                    CASE
                        WHEN kilometros_odometro > 0 THEN galones_consumidos / kilometros_odometro
                    END AS consumo_real,
                    CASE
                        WHEN kilometros_odometro > 0
                        AND viajes_cruzan_limites = 0
                        AND viajes_sin_estimacion = 0 THEN galones_estimados_viajes / NULLIF(kilometros_viajes, 0)
                    END AS consumo_referencia
                FROM
                    intervalos
            )
        SELECT
            id_vehiculo,
            id_inicio AS id_abastecimiento_inicio,
            id_abastecimiento_combustible AS id_abastecimiento_fin,
            to_char(inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            to_char(fecha_hora, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin,
            odometro_inicio::text,
            kilometraje_odometro::text AS odometro_fin,
            kilometros_odometro::text,
            galones_consumidos::text,
            importe_cargas::text AS importe_comprado_intervalo,
            cantidad_cargas,
            kilometros_viajes::text,
            galones_estimados_viajes::text,
            viajes_completos,
            viajes_cruzan_limites,
            viajes_sin_estimacion,
            (kilometros_odometro - kilometros_viajes)::text AS diferencia_kilometros,
            round(consumo_real, 6)::text AS consumo_real_galones_km,
            round(consumo_referencia, 6)::text AS consumo_referencia_galones_km,
            round(consumo_referencia * kilometros_odometro, 6)::text AS galones_referencia_odometro,
            round(galones_consumidos - consumo_referencia * kilometros_odometro, 6)::text AS diferencia_galones,
            round((consumo_real - consumo_referencia) * 100 / NULLIF(consumo_referencia, 0), 2)::text AS desviacion_porcentaje,
            CASE
                WHEN consumo_referencia IS NOT NULL THEN consumo_real > consumo_referencia
                ELSE NULL
            END AS supera_referencia,
            CASE
                WHEN id_inicio IS NULL THEN 'SIN_CARGA_INICIAL'
                WHEN kilometros_odometro <= 0 THEN 'ODOMETRO_SIN_AVANCE'
                WHEN viajes_cruzan_limites > 0 THEN 'VIAJES_CRUZAN_LIMITES'
                WHEN consumo_referencia IS NULL THEN 'SIN_REFERENCIA_VIAJES'
                ELSE 'COMPARABLE'
            END AS estado_comparacion,
            count(*) OVER ()::int AS total_registros
        FROM
            medidas
        ORDER BY
            fecha_hora DESC,
            id_abastecimiento_combustible DESC
        LIMIT
            $4
        OFFSET
            $5
    `,
        [
            filtros.fecha_desde,
            filtros.fecha_hasta,
            filtros.id_vehiculo,
            filtros.limit,
            filtros.offset
        ]
    );

    return result.rows;
};

module.exports = {
    viajes,
    resumen,
    viaticos,
    combustible
};
