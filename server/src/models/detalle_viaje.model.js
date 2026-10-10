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

module.exports = { create };
