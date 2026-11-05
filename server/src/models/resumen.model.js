const pool = require('../config/database');

// Cada origen se agrega por separado: los pagos no multiplican facturas ni costos.
const mensual = async ({ fecha_desde, fecha_hasta }, client = pool) => {
    const result = await client.query(`
        WITH gastos AS (
            SELECT * FROM gasto_clasificado
            WHERE estado='REGISTRADO' AND fecha BETWEEN $1::date AND $2::date
        ), conceptos AS (
            SELECT 1 orden, 'Viáticos desembolsados' concepto, COALESCE(SUM(monto),0) importe FROM gastos WHERE origen='VIATICO'
            UNION ALL SELECT 2, 'Remuneraciones calculadas', COALESCE(SUM(total),0) FROM remuneracion_chofer WHERE fecha BETWEEN $1::date AND $2::date
            UNION ALL SELECT 3, 'Combustible registrado', COALESCE(SUM(monto),0) FROM gastos WHERE origen='COMBUSTIBLE'
            UNION ALL SELECT 4, 'Peajes registrados', COALESCE(SUM(monto),0) FROM gastos WHERE origen='OPERATIVO' AND tipo_gasto='PEAJE'
            UNION ALL SELECT 5, 'Otros gastos operativos', COALESCE(SUM(monto),0) FROM gastos WHERE origen='OPERATIVO' AND tipo_gasto<>'PEAJE'
            UNION ALL SELECT 6, 'Mantenimientos y reparaciones', COALESCE(SUM(monto),0) FROM mantenimiento
                WHERE estado='REGISTRADO' AND fecha_inicio >= $1::date AND fecha_inicio < $2::date+1
        ), ingresos AS (
            SELECT COUNT(*)::int cantidad_viajes, COALESCE(SUM(d.valor),0) ingresos_viajes
            FROM viaje v
            LEFT JOIN LATERAL (
                SELECT SUM(valor_transporte) valor FROM detalle_viaje WHERE id_viaje=v.id_viaje
            ) d ON true
            WHERE v.estado='REGISTRADO' AND v.fecha_inicio >= $1::date AND v.fecha_inicio < $2::date+1
        ), caja AS (
            SELECT (SELECT COALESCE(SUM(p.monto),0) FROM pago p JOIN factura f USING(id_factura)
                WHERE p.estado='REGISTRADO' AND f.estado<>'ANULADA' AND p.fecha_pago BETWEEN $1::date AND $2::date) cobros,
                (SELECT COALESCE(SUM(monto),0) FROM gastos WHERE id_pago_proveedor IS NULL) gastos_pagados,
                (SELECT COALESCE(SUM(p.monto),0) FROM pago_proveedor p JOIN factura_proveedor f USING(id_factura_proveedor)
                WHERE p.estado='REGISTRADO' AND f.estado<>'ANULADA' AND p.fecha_pago BETWEEN $1::date AND $2::date) pagos_proveedores
        ), cobertura AS (
            SELECT (SELECT COUNT(*)::int FROM chofer WHERE fecha_inicio_trabajo IS NULL) choferes_sin_fecha,
                (SELECT COUNT(*)::int FROM chofer c CROSS JOIN LATERAL generate_series(
                    GREATEST(c.fecha_inicio_trabajo,$1::date),
                    LEAST(COALESCE(c.fecha_fin_trabajo,$2::date),$2::date,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date-1), interval '1 day') d(fecha)
                 WHERE c.fecha_inicio_trabajo IS NOT NULL AND NOT EXISTS (
                    SELECT 1 FROM remuneracion_chofer r WHERE r.id_chofer=c.id_chofer AND r.fecha=d.fecha::date)) dias_pendientes
        )
        SELECT i.*, c.*, cobertura.*, (SELECT SUM(importe) FROM conceptos) total_costos,
            i.ingresos_viajes-(SELECT SUM(importe) FROM conceptos) resultado,
            c.gastos_pagados+c.pagos_proveedores desembolsos,
            c.cobros-c.gastos_pagados-c.pagos_proveedores flujo_registrado,
            (SELECT json_agg(json_build_object('concepto',concepto,'importe',importe::text) ORDER BY orden) FROM conceptos) conceptos,
            to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil','YYYY-MM-DD"T"HH24:MI:SS') generado_en,
            ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date-1)::text remuneraciones_hasta
        FROM ingresos i CROSS JOIN caja c CROSS JOIN cobertura
    `, [fecha_desde, fecha_hasta]);
    return { fecha_desde, fecha_hasta, ...result.rows[0] };
};

const cuentasPorCobrar = async (client = pool) => {
    const result = await client.query(`
        WITH pendientes AS (
            SELECT f.id_factura, f.numero_factura, f.fecha_emision::text, f.fecha_vencimiento::text,
                l.id_gasolinera, g.nombre gasolinera, f.valor_neto, COALESCE(p.cobrado,0) cobrado,
                f.valor_neto-COALESCE(p.cobrado,0) saldo,
                COALESCE(f.fecha_vencimiento < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date,false) vencida
            FROM factura f JOIN liquidacion l USING(id_liquidacion) JOIN gasolinera g USING(id_gasolinera)
            LEFT JOIN LATERAL (SELECT SUM(monto) cobrado FROM pago WHERE id_factura=f.id_factura AND estado='REGISTRADO') p ON true
            WHERE f.estado<>'ANULADA' AND f.valor_neto>COALESCE(p.cobrado,0)
        ), clientes AS (
            SELECT id_gasolinera, gasolinera, COUNT(*)::int cantidad_facturas,
                SUM(valor_neto)::text neto_facturas_pendientes, SUM(cobrado)::text cobrado,
                SUM(saldo)::text saldo, COALESCE(SUM(saldo) FILTER(WHERE vencida),0)::text vencido,
                json_agg(json_build_object('id_factura',id_factura,'numero_factura',numero_factura,
                    'fecha_emision',fecha_emision,'fecha_vencimiento',fecha_vencimiento,'valor_neto',valor_neto::text,
                    'cobrado',cobrado::text,'saldo',saldo::text,'vencida',vencida) ORDER BY fecha_emision,id_factura) facturas
            FROM pendientes GROUP BY id_gasolinera,gasolinera
        ) SELECT COALESCE((SELECT SUM(saldo) FROM pendientes),0) total_pendiente,
            COALESCE((SELECT SUM(saldo) FROM pendientes WHERE vencida),0) total_vencido,
            (SELECT COUNT(*)::int FROM pendientes) cantidad_facturas,
            (SELECT COUNT(*)::int FROM clientes) cantidad_clientes,
            COALESCE((SELECT json_agg(clientes ORDER BY saldo::numeric DESC,gasolinera) FROM clientes),'[]') clientes,
            to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil','YYYY-MM-DD"T"HH24:MI:SS') generado_en
    `);
    return result.rows[0] ?? null;
};

module.exports = { mensual, cuentasPorCobrar };
