const pool = require('../config/database');

const findAll = async (filtros, client = pool) => {
    const result = await client.query(`WITH entregas AS (
        SELECT v.id_viaje,v.id_vehiculo,d.id_terminal,d.id_gasolinera,d.galones,d.valor_transporte
        FROM viaje v JOIN detalle_viaje d USING(id_viaje)
        WHERE v.estado='REGISTRADO' AND v.fecha_inicio >= $1::date AND v.fecha_inicio < $2::date+1
            AND ($3::int IS NULL OR v.id_vehiculo=$3) AND ($4::int IS NULL OR d.id_terminal=$4)
    ), terminales AS (
        SELECT e.id_vehiculo,e.id_terminal,t.nombre terminal,sum(e.valor_transporte) ingresos
        FROM entregas e JOIN terminal t USING(id_terminal) GROUP BY e.id_vehiculo,e.id_terminal,t.nombre
    ), costos AS (
        SELECT v.id_vehiculo,sum(c.valor) costo FROM (SELECT DISTINCT id_viaje,id_vehiculo FROM entregas) v
        JOIN costo_viaje c USING(id_viaje) GROUP BY v.id_vehiculo
    ), resumen AS (
        SELECT e.id_vehiculo,ve.placa,count(DISTINCT e.id_viaje)::int viajes,count(*)::int entregas,
            sum(e.galones) galones,sum(e.valor_transporte) ingresos,
            string_agg(DISTINCT g.nombre, ' · ' ORDER BY g.nombre) gasolineras
        FROM entregas e JOIN vehiculo ve USING(id_vehiculo) JOIN gasolinera g USING(id_gasolinera)
        GROUP BY e.id_vehiculo,ve.placa
    ) SELECT r.*, CASE WHEN $4::int IS NULL THEN COALESCE(c.costo,0) END costo_estimado,
        CASE WHEN $4::int IS NULL THEN r.ingresos-COALESCE(c.costo,0) END margen_estimado,
        COALESCE(round(r.ingresos*100/NULLIF(sum(r.ingresos) OVER(),0),2),0) participacion,
        (SELECT json_agg(t ORDER BY terminal) FROM terminales t WHERE t.id_vehiculo=r.id_vehiculo) terminales,
        count(*) OVER()::int total_registros
    FROM resumen r LEFT JOIN costos c USING(id_vehiculo)
    ORDER BY r.placa LIMIT $5 OFFSET $6`, [filtros.fecha_desde,filtros.fecha_hasta,filtros.id_vehiculo,
        filtros.id_terminal,filtros.limit,filtros.offset]);
    return result.rows;
};
module.exports = { findAll };
