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
        estado
    } = data;

    const result = await pool.query(
        `INSERT INTO categoria_producto (
            nombre,
            descripcion,
            estado
        )
        VALUES ($1, $2, $3)
        RETURNING *`,
        [
            nombre,
            descripcion,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (id, data) => {
    const {
        nombre,
        descripcion,
        estado
    } = data;

    const result = await pool.query(
        `UPDATE categoria_producto
        SET
            nombre = $1,
            descripcion = $2,
            estado = $3
        WHERE id_categoria = $4
        RETURNING *`,
        [
            nombre,
            descripcion,
            estado,
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