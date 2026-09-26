const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(
        "SELECT * FROM gasolinera ORDER BY id_gasolinera"
    );

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM gasolinera WHERE id_gasolinera = $1",
        [id]
    );

    return result.rows[0] || null;
};

const create = async (data) => {
    const {
        nombre,
        ruc,
        direccion,
        telefono,
        correo,
        representante_legal,
        agente_retencion,
        estado
    } = data;

    const result = await pool.query(
        `INSERT INTO gasolinera (
            nombre,
            ruc,
            direccion,
            telefono,
            correo,
            representante_legal,
            agente_retencion,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            nombre,
            ruc,
            direccion,
            telefono,
            correo,
            representante_legal,
            agente_retencion,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (id, data) => {
    const {
        nombre,
        ruc,
        direccion,
        telefono,
        correo,
        representante_legal,
        agente_retencion,
        estado
    } = data;

    const result = await pool.query(
        `UPDATE gasolinera
        SET
            nombre = $1,
            ruc = $2,
            direccion = $3,
            telefono = $4,
            correo = $5,
            representante_legal = $6,
            agente_retencion = $7,
            estado = $8
        WHERE id_gasolinera = $9
        RETURNING *`,
        [
            nombre,
            ruc,
            direccion,
            telefono,
            correo,
            representante_legal,
            agente_retencion,
            estado,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `DELETE FROM gasolinera
        WHERE id_gasolinera = $1
        RETURNING *`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};