const pool = require("../config/database");

const findByViaje = async (id, client = pool) => {
    return (await client.query(`
        SELECT 
            d.*, 
            t.id_gasolinera,
            t.id_terminal,
            g.nombre AS nombre_gasolinera, 
            te.nombre AS nombre_terminal,
            p.nombre AS nombre_producto_transportado, 
            p.unidad_medida
        FROM detalle_viaje d JOIN tarifa t USING (id_tarifa)
        JOIN gasolinera g USING (id_gasolinera) JOIN terminal te USING (id_terminal)
        JOIN producto_transportado p USING (id_producto_transportado)
        WHERE d.id_viaje=$1 ORDER BY d.id_detalle_viaje`, [id])).rows;
};

const findByViajeForUpdate = async (client, id) => {
    return (await client.query(`
        SELECT * FROM detalle_viaje WHERE id_viaje=$1
        ORDER BY id_detalle_viaje FOR UPDATE`, [id])
    ).rows;
};

const create = async (client, id, detalle, tarifa) => {
    return (await client.query(`
        INSERT INTO detalle_viaje (
            id_viaje,
            id_tarifa,
            id_producto_transportado,
            galones,
            tarifa_aplicada,
            valor_transporte
        )
        VALUES ($1,$2,$3,$4,$5,round($4::numeric*$5::numeric,2)) 
        RETURNING *`,
        [
            id,
            tarifa.id_tarifa,
            detalle.id_producto_transportado,
            detalle.galones,
            tarifa.valor_por_galon
        ])
    ).rows[0];
};

module.exports = { 
    findByViaje, 
    findByViajeForUpdate, 
    create 
};
