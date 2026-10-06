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

const findByIdForUpdate = async (client, id) => {
    const result = await client.query(
        "SELECT * FROM factura_proveedor WHERE id_factura_proveedor = $1 FOR UPDATE",
        [id]
    );

    return result.rows[0];
};

module.exports = {
    findByIdForUpdate,
    findAll,
    findById,
    create,
    updateTotales
};
