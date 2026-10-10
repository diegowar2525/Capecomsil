const create = async (client, data) => {
    return (await client.query(`
        INSERT INTO viaje (
            id_vehiculo,
            id_chofer,
            fecha
        )
        VALUES ($1,$2,$3) RETURNING *`,
        [
            data.id_vehiculo,
            data.id_chofer,
            data.fecha])
    ).rows[0];
};

const getTotales = async (client, id) => {
    return (await client.query(`
        SELECT SUM(galones)::text AS total_galones,
        SUM(valor_transporte)::text AS valor_transporte FROM detalle_viaje WHERE id_viaje=$1`, [id])
    ).rows[0];
};

module.exports = { create, getTotales };
