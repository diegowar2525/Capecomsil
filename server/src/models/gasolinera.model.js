const pool = require("../config/database");
const select = `SELECT t.*, c.id_provincia, c.nombre AS ciudad, p.nombre AS provincia
    FROM gasolinera t LEFT JOIN ciudad c USING(id_ciudad) LEFT JOIN provincia p USING(id_provincia)`;
const findAll = async (client = pool) => (await client.query(`${select} ORDER BY id_gasolinera`)).rows;
const findById = async (id, client = pool) => (await client.query(`${select} WHERE id_gasolinera = $1`, [id])).rows[0] ?? null;

const create = async (data, client = pool) => {
    const {
        nombre,
        ruc,
        direccion,
        telefono,
        correo,
        representante_legal,
        agente_retencion,
        estado,
        id_ciudad
    } = data;
    const result = await client.query(
        `
        INSERT INTO
            gasolinera (
                nombre,
                ruc,
                direccion,
                telefono,
                correo,
                representante_legal,
                agente_retencion,
                estado,
                id_ciudad
            )
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
            *
    `,
        [nombre, ruc, direccion, telefono, correo, representante_legal, agente_retencion, estado, id_ciudad]
    );

    return result.rows[0] ?? null;
};

const update = async (id, data, client = pool) => {
    const {
        nombre,
        ruc,
        direccion,
        telefono,
        correo,
        representante_legal,
        agente_retencion,
        estado,
        id_ciudad
    } = data;
    const result = await client.query(
        `
        UPDATE gasolinera
        SET
            nombre = $1,
            ruc = $2,
            direccion = $3,
            telefono = $4,
            correo = $5,
            representante_legal = $6,
            agente_retencion = $7,
            estado = $8, id_ciudad = $9
        WHERE
            id_gasolinera = $10
        RETURNING
            *
    `,
        [
            nombre,
            ruc,
            direccion,
            telefono,
            correo,
            representante_legal,
            agente_retencion,
            estado,
            id_ciudad,
            id
        ]
    );

    return result.rows[0] ?? null;
};

const remove = async (id, client = pool) => {
    const result = await client.query(
        `
        DELETE FROM gasolinera
        WHERE
            id_gasolinera = $1
        RETURNING
            *
    `,
        [id]
    );

    return result.rows[0] ?? null;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
