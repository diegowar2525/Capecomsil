const pool = require("../config/database");

const fields = `
    id_modalidad_tarifa, id_gasolinera, modalidad,
    fecha_inicio::text, fecha_fin::text, fecha_creacion
`;

const findAll = async (idGasolinera, client = pool) => {
    const result = await client.query(`
        SELECT ${fields}
        FROM modalidad_tarifa_gasolinera
        WHERE ($1::integer IS NULL OR id_gasolinera = $1)
        ORDER BY id_gasolinera, fecha_inicio DESC
    `, [idGasolinera]);
    return result.rows;
};

const findVigente = async (client, idGasolinera, fecha) => {
    const result = await client.query(`
        SELECT ${fields}
        FROM modalidad_tarifa_gasolinera
        WHERE id_gasolinera = $1
            AND fecha_inicio <= $2::date
            AND (fecha_fin IS NULL OR fecha_fin >= $2::date)
        FOR UPDATE
    `, [idGasolinera, fecha]);
    return result.rows[0] ?? null;
};

const cerrar = async (client, id, fecha) => {
    await client.query(`
        UPDATE modalidad_tarifa_gasolinera
        SET fecha_fin = $2::date - 1
        WHERE id_modalidad_tarifa = $1
    `, [id, fecha]);
};

const create = async (client, data) => {
    const result = await client.query(`
        INSERT INTO modalidad_tarifa_gasolinera (
            id_gasolinera, modalidad, fecha_inicio, fecha_fin
        )
        VALUES ($1, $2, $3, $4)
        RETURNING ${fields}
    `, [data.id_gasolinera, data.modalidad, data.fecha_inicio, data.fecha_fin]);
    return result.rows[0];
};

module.exports = { findAll, findVigente, cerrar, create };
