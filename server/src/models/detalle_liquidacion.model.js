const pool = require("../config/database");

const findByLiquidacion = async (id, client = pool) => {
    const result = await client.query(
        `SELECT dl.*, d.id_viaje, d.id_producto_transportado, p.nombre AS nombre_producto_transportado,
            p.unidad_medida, t.id_terminal, te.nombre AS nombre_terminal,
            to_char(v.fecha_inicio,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            veh.placa, ch.nombre AS nombre_chofer
         FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
         JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
         JOIN terminal te USING(id_terminal) JOIN producto_transportado p USING(id_producto_transportado)
         JOIN vehiculo veh USING(id_vehiculo) JOIN chofer ch USING(id_chofer)
         WHERE dl.id_liquidacion=$1 ORDER BY dl.id_detalle_liquidacion`, [id]
    );
    return result.rows;
};

const findDisponibles = async (filtros, client = pool) => {
    const result = await client.query(
        `SELECT d.id_detalle_viaje, d.id_viaje, d.id_producto_transportado, d.galones,
            d.tarifa_aplicada, d.valor_transporte, t.id_gasolinera, t.id_terminal,
            te.nombre AS nombre_terminal, p.nombre AS nombre_producto_transportado, p.unidad_medida,
            v.id_vehiculo, veh.placa, v.id_chofer, ch.nombre AS nombre_chofer,
            to_char(v.fecha_inicio,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio,
            to_char(v.fecha_fin,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_fin,
            EXISTS(SELECT 1 FROM detalle_liquidacion propia
                   WHERE propia.id_liquidacion=$4 AND propia.id_detalle_viaje=d.id_detalle_viaje) AS seleccionada,
            count(*) OVER()::integer AS cantidad_disponible,
            sum(d.galones) OVER()::text AS galones_disponibles,
            sum(d.valor_transporte) OVER()::text AS transporte_disponible
         FROM detalle_viaje d JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
         JOIN terminal te USING(id_terminal) JOIN producto_transportado p USING(id_producto_transportado)
         JOIN vehiculo veh USING(id_vehiculo) JOIN chofer ch USING(id_chofer)
         WHERE t.id_gasolinera=$1 AND v.estado='REGISTRADO'
           AND v.fecha_inicio >= $2::date AND v.fecha_inicio < $3::date + interval '1 day'
           AND NOT EXISTS (
               SELECT 1 FROM detalle_liquidacion dl JOIN liquidacion l USING(id_liquidacion)
               WHERE dl.id_detalle_viaje=d.id_detalle_viaje AND l.estado<>'ANULADA'
                 AND l.id_liquidacion IS DISTINCT FROM $4::integer
           )
         ORDER BY v.fecha_inicio, d.id_detalle_viaje`,
        [filtros.id_gasolinera, filtros.periodo_inicio, filtros.periodo_fin, filtros.id_liquidacion ?? null]
    );
    return result.rows;
};

const lockEntregas = async (client, ids) => {
    const result = await client.query(
        `SELECT id_detalle_viaje FROM detalle_viaje WHERE id_detalle_viaje=ANY($1::integer[])
         ORDER BY id_detalle_viaje FOR UPDATE`, [ids]
    );
    return result.rows;
};

const create = async (client, idLiquidacion, idDetalleViaje) => {
    // El trigger copia galones, tarifa e importe históricos; el cliente no los decide.
    const result = await client.query(
        `INSERT INTO detalle_liquidacion(id_liquidacion,id_detalle_viaje)
         VALUES ($1,$2) RETURNING *`, [idLiquidacion, idDetalleViaje]
    );
    return result.rows[0] ?? null;
};

const removeNoSeleccionados = async (client, idLiquidacion, ids) => {
    const result = await client.query(
        `DELETE FROM detalle_liquidacion WHERE id_liquidacion=$1
         AND NOT (id_detalle_viaje=ANY($2::integer[])) RETURNING id_detalle_liquidacion`, [idLiquidacion, ids]
    );
    return result.rows;
};

module.exports = { findByLiquidacion, findDisponibles, lockEntregas, create, removeNoSeleccionados };
