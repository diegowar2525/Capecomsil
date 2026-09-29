const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query("SELECT * FROM factura_proveedor ORDER BY id_factura_proveedor DESC");
    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(`
        SELECT f.*, COALESCE((
            SELECT jsonb_agg(to_jsonb(d) || jsonb_build_object(
                'cantidad', d.cantidad::text, 'precio_unitario', d.precio_unitario::text,
                'descuento', d.descuento::text, 'subtotal', d.subtotal::text,
                'porcentaje_impuesto', d.porcentaje_impuesto::text,
                'impuesto', d.impuesto::text, 'total_linea', d.total_linea::text)
                ORDER BY d.id_detalle_factura_proveedor)
            FROM detalle_factura_proveedor d WHERE d.id_factura_proveedor = f.id_factura_proveedor
        ), '[]'::jsonb) AS detalles
        FROM factura_proveedor f WHERE id_factura_proveedor = $1
    `, [id]);
    return result.rows[0];
};

const create = async (client, data) => {
    const result = await client.query(`
        INSERT INTO factura_proveedor (
            id_proveedor,
            numero_factura,
            fecha_emision,
            fecha_vencimiento,
            subtotal,
            descuento_total,
            impuestos,total
        )
        VALUES ($1, $2, $3, $4, 0, 0, 0, 0) 
        RETURNING *`,
        [
            data.id_proveedor,
            data.numero_factura,
            data.fecha_emision,
            data.fecha_vencimiento
        ]
    );
    return result.rows[0];
};

const createDetalle = async (client, id, data) => {
    // PostgreSQL NUMERIC realiza los cálculos sin aritmética binaria de JavaScript.
    const result = await client.query(`
        WITH base AS (
            SELECT round($5::numeric * $6::numeric, 2) - $7::numeric AS subtotal
        ), calculo AS (
            SELECT subtotal, round(subtotal * $8::numeric / 100, 2) AS impuesto FROM base
        )
        INSERT INTO detalle_factura_proveedor (
            id_factura_proveedor,
            tipo_concepto,
            id_producto,
            descripcion,
            cantidad,
            precio_unitario,
            descuento,subtotal,
            porcentaje_impuesto,
            impuesto,
            total_linea
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, subtotal, $8, impuesto, subtotal+impuesto 
        FROM calculo
        RETURNING *`,
        [
            id,
            data.tipo_concepto,
            data.id_producto,
            data.descripcion,
            data.cantidad,
            data.precio_unitario,
            data.descuento,
            data.porcentaje_impuesto
        ]
    );
    return result.rows[0];
};

const updateTotales = async (client, id) => {
    const result = await client.query(`
        UPDATE factura_proveedor SET subtotal = t.subtotal, descuento_total = t.descuento,
            impuestos = t.impuestos, total = t.subtotal + t.impuestos
        FROM (
            SELECT SUM(subtotal) AS subtotal, 
            SUM(descuento) AS descuento, 
            SUM(impuesto) AS impuestos
        FROM detalle_factura_proveedor WHERE id_factura_proveedor=$1) t
        WHERE id_factura_proveedor=$1 RETURNING factura_proveedor.*`,
        [id]
    );
    return result.rows[0];
};

const findProveedor = async (client, id) => {
    const result = await client.query("SELECT id_proveedor FROM proveedor WHERE id_proveedor=$1 FOR SHARE", [id]);
    return result.rows[0];
};

const findProducto = async (client, id) => {
    const result = await client.query("SELECT id_producto FROM producto WHERE id_producto=$1 FOR UPDATE", [id]);
    return result.rows[0];
};

const createRecepcion = async (client, id, fecha) => {
    const result = await client.query(`INSERT INTO recepcion_compra(id_factura_proveedor,fecha_recepcion)
        VALUES ($1,$2) RETURNING *`, [id, fecha]);
    return result.rows[0];
};

const createEntrada = async (client, recepcion, detalle, cantidad) => {
    const result = await client.query(`
        INSERT INTO detalle_recepcion_compra(
            id_recepcion_compra,
            id_detalle_factura_proveedor,
            cantidad_recibida
        )
        SELECT $1, $2, $3 
        FROM (VALUES ($1, $2, $3)) AS v(id_recepcion_compra, id_detalle_factura_proveedor, cantidad_recibida)
        WHERE v.cantidad_recibida::numeric <= $4::numeric RETURNING *`,
        [
            recepcion.id_recepcion_compra,
            detalle.id_detalle_factura_proveedor,
            cantidad,
            detalle.cantidad
        ]
    );
    if (!result.rows[0]) return null;
    await client.query(
        `INSERT INTO movimiento_inventario(
            id_producto,
            fecha,
            tipo_movimiento,
            cantidad,
            motivo,
            id_detalle_recepcion_compra
        )
        VALUES ($1, $2, 'ENTRADA', $3, 'Recepción de compra', $4)`,
        [
            detalle.id_producto,
            recepcion.fecha_recepcion,
            cantidad,
            result.rows[0].id_detalle_recepcion_compra
        ]
    );
    return result.rows[0];
};

module.exports = {
    findAll,
    findById,
    create,
    createDetalle,
    updateTotales,
    findProveedor,
    findProducto,
    createRecepcion,
    createEntrada
};
