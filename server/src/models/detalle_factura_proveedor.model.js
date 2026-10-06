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

module.exports = {
    create
};
