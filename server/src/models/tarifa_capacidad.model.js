const pool = require("../config/database");

const fields = `
    id_tarifa_capacidad, id_gasolinera, capacidad_galones, valor_por_galon,
    fecha_inicio::text, fecha_fin::text, estado
`;

const findAll = async (client = pool) => {
    const result = await client.query(`
        SELECT ${fields}
        FROM tarifa_capacidad
        ORDER BY id_tarifa_capacidad DESC
    `);
    return result.rows;
};

const findById = async (id, client = pool) => {
    const result = await client.query(`
        SELECT ${fields}
        FROM tarifa_capacidad
        WHERE id_tarifa_capacidad = $1
    `, [id]);
    return result.rows[0] ?? null;
};

const findVigente = async (client, idGasolinera, capacidad, fecha) => {
    const result = await client.query(`
        SELECT ${fields}
        FROM tarifa_capacidad
        WHERE id_gasolinera = $1
            AND capacidad_galones = $2::numeric
            AND estado
            AND fecha_inicio <= $3::date
            AND (fecha_fin IS NULL OR fecha_fin >= $3::date)
        FOR UPDATE
    `, [idGasolinera, capacidad, fecha]);
    return result.rows[0] ?? null;
};

const create = async (data, client = pool) => {
    const result = await client.query(`
        INSERT INTO tarifa_capacidad (
            id_gasolinera, capacidad_galones, valor_por_galon, fecha_inicio, fecha_fin, estado
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${fields}
    `, [
        data.id_gasolinera, data.capacidad_galones, data.valor_por_galon,
        data.fecha_inicio, data.fecha_fin, data.estado
    ]);
    return result.rows[0];
};

const update = async (id, data, client = pool) => {
    const result = await client.query(`
        UPDATE tarifa_capacidad
        SET id_gasolinera = $2, capacidad_galones = $3, valor_por_galon = $4,
            fecha_inicio = $5, fecha_fin = $6, estado = $7
        WHERE id_tarifa_capacidad = $1
        RETURNING ${fields}
    `, [
        id, data.id_gasolinera, data.capacidad_galones, data.valor_por_galon,
        data.fecha_inicio, data.fecha_fin, data.estado
    ]);
    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(`
        DELETE FROM tarifa_capacidad
        WHERE id_tarifa_capacidad = $1
        RETURNING ${fields}
    `, [id]);
    return result.rows[0] ?? null;
};

module.exports = { findAll, findById, findVigente, create, update, remove };
