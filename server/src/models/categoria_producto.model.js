const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(
        "SELECT * FROM categoria_producto ORDER BY id_categoria"
    );

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM categoria_producto WHERE id_categoria = $1",
        [id]
    );

    return result.rows[0] || null;
};

const create = async (data) => {
    const {
        nombre,
        descripcion,
        estado,
        es_llanta
    } = data;

    const result = await pool.query(
        `INSERT INTO categoria_producto (
            nombre,
            descripcion,
            estado,
            es_llanta
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
            nombre,
            descripcion,
            estado,
            es_llanta
        ]
    );

    return result.rows[0];
};

const update = async (id, data) => {
    const {
        nombre,
        descripcion,
        estado,
        es_llanta
    } = data;

    const result = await pool.query(
        `UPDATE categoria_producto
        SET
            nombre = $1,
            descripcion = $2,
            estado = $3,
            es_llanta = $4
        WHERE id_categoria = $5
        RETURNING *`,
        [
            nombre,
            descripcion,
            estado,
            es_llanta,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `DELETE FROM categoria_producto
        WHERE id_categoria = $1
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