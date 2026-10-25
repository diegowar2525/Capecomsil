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

const puedeCorregir = async (client, periodo) => {
    const { id_gasolinera: idGasolinera, id_modalidad_tarifa: id, fecha_inicio: inicio, fecha_fin: fin } = periodo;
    // El bloqueo de la gasolinera impide nuevas referencias durante la comprobación.
    await client.query('SELECT id_gasolinera FROM gasolinera WHERE id_gasolinera = $1 FOR UPDATE', [idGasolinera]);
    const result = await client.query(`
        SELECT
            NOT EXISTS (SELECT 1 FROM detalle_viaje WHERE id_modalidad_tarifa = $2)
            AND NOT EXISTS (SELECT 1 FROM tramo_viaje t JOIN trayecto r USING (id_trayecto)
                JOIN viaje v USING (id_viaje)
                WHERE (r.id_gasolinera_origen = $1 OR r.id_gasolinera_destino = $1)
                AND daterange($3::date, $4::date, '[]') @> v.fecha_inicio::date)
            AND NOT EXISTS (SELECT 1 FROM liquidacion WHERE id_gasolinera = $1
                AND daterange(periodo_inicio, periodo_fin, '[]') && daterange($3::date, $4::date, '[]'))
            AS permitido
    `, [idGasolinera, id, inicio, fin]);
    return result.rows[0].permitido;
};

const corregir = async (client, id, modalidad) => {
    const result = await client.query(`
        UPDATE modalidad_tarifa_gasolinera SET modalidad = $2
        WHERE id_modalidad_tarifa = $1 RETURNING ${fields}
    `, [id, modalidad]);
    return result.rows[0];
};

module.exports = { findAll, findVigente, cerrar, create, puedeCorregir, corregir };
