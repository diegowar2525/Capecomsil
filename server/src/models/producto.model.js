const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(`
        SELECT producto.*, categoria.nombre AS nombre_categoria
        FROM producto
        JOIN categoria_producto AS categoria USING (id_categoria)
        ORDER BY id_producto DESC
    `);

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        `
        SELECT producto.*, categoria.nombre AS nombre_categoria
        FROM producto
        JOIN categoria_producto AS categoria USING (id_categoria)
        WHERE id_producto = $1
        `,
        [id]
    );

    return result.rows[0];
};

const create = async (data) => {
    const {
        id_categoria,
        nombre,
        medida,
        modelo,
        marca,
        descripcion,
        unidad_medida,
        stock_minimo,
        estado
    } = data;

    const result = await pool.query(
        `
        INSERT INTO producto (
            id_categoria,
            nombre,
            medida,
            modelo,
            marca,
            descripcion,
            unidad_medida,
            stock_minimo,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            id_categoria,
            nombre,
            medida,
            modelo,
            marca,
            descripcion,
            unidad_medida,
            stock_minimo,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (id, data) => {
    const {
        id_categoria,
        nombre,
        medida,
        modelo,
        marca,
        descripcion,
        unidad_medida,
        stock_minimo,
        estado
    } = data;

    const result = await pool.query(
        `
        UPDATE producto
        SET
            id_categoria = $1,
            nombre = $2,
            medida = $3,
            modelo = $4,
            marca = $5,
            descripcion = $6,
            unidad_medida = $7,
            stock_minimo = $8,
            estado = $9
        WHERE id_producto = $10
        RETURNING *
        `,
        [
            id_categoria,
            nombre,
            medida,
            modelo,
            marca,
            descripcion,
            unidad_medida,
            stock_minimo,
            estado,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM producto
        WHERE id_producto = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};

const hasHistory = async (id) => {
    const result = await pool.query(
        `
        SELECT EXISTS (
            SELECT 1 FROM detalle_factura_proveedor WHERE id_producto = $1
            UNION ALL
            SELECT 1 FROM movimiento_inventario WHERE id_producto = $1
            UNION ALL
            SELECT 1 FROM detalle_mantenimiento WHERE id_producto = $1
        ) AS tiene_historial
        `,
        [id]
    );

    return result.rows[0].tiene_historial;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    hasHistory
};
