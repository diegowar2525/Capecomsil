const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(
        `SELECT *
        FROM producto_transportado
        ORDER BY id_producto_transportado`
    );

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        `SELECT *
        FROM producto_transportado
        WHERE id_producto_transportado = $1`,
        [id]
    );

    return result.rows[0] || null;
};

const create = async (data) => {
    const {
        nombre,
        descripcion,
        unidad_medida,
        estado
    } = data;

    const result = await pool.query(
        `INSERT INTO producto_transportado (
            nombre,
            descripcion,
            unidad_medida,
            estado
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
            nombre,
            descripcion,
            unidad_medida,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (id, data) => {
    const {
        nombre,
        descripcion,
        unidad_medida,
        estado
    } = data;

    const result = await pool.query(
        `UPDATE producto_transportado
        SET
            nombre = $1,
            descripcion = $2,
            unidad_medida = $3,
            estado = $4
        WHERE id_producto_transportado = $5
        RETURNING *`,
        [
            nombre,
            descripcion,
            unidad_medida,
            estado,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `DELETE FROM producto_transportado
        WHERE id_producto_transportado = $1
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