const pool = require("../config/database");

const create = async (client, id, data) => {
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

const findByIdForShare = async (client, id) => {
    const result = await client.query(
        "SELECT * FROM detalle_factura_proveedor WHERE id_detalle_factura_proveedor = $1 FOR SHARE",
        [id]
    );

    return result.rows[0];
};

const findPendientesByFactura = async (id) => {
    const result = await pool.query(
        `
        SELECT d.id_detalle_factura_proveedor, d.id_producto, d.descripcion,
            p.nombre AS nombre_producto, p.unidad_medida, d.cantidad AS cantidad_facturada,
            COALESCE(s.recibido, 0)::text AS cantidad_recibida,
            (d.cantidad - COALESCE(s.recibido, 0))::text AS pendiente_recibir
        FROM detalle_factura_proveedor d
        JOIN producto p USING (id_producto)
        LEFT JOIN (
            SELECT dr.id_detalle_factura_proveedor, SUM(dr.cantidad_recibida) AS recibido
            FROM detalle_recepcion_compra dr
            JOIN recepcion_compra r USING (id_recepcion_compra)
            WHERE r.estado = 'REGISTRADA'
            GROUP BY dr.id_detalle_factura_proveedor
        ) s USING (id_detalle_factura_proveedor)
        WHERE d.id_factura_proveedor = $1 AND d.tipo_concepto = 'PRODUCTO'
        ORDER BY d.id_detalle_factura_proveedor
        `,
        [id]
    );

    return result.rows;
};

module.exports = {
    findPendientesByFactura,
    findByIdForShare,
    create
};
