// El servicio bloquea la factura antes de comprobar lo recibido.
const create = async (client, idRecepcion, detalle, cantidad, observacion = null) => {
    const result = await client.query(
        `
        INSERT INTO detalle_recepcion_compra (
            id_recepcion_compra,
            id_detalle_factura_proveedor,
            cantidad_recibida,
            observacion
        )
        SELECT $1::integer, $2::integer, $3::numeric, $5::text
        WHERE $3::numeric <= $4::numeric - (
            SELECT COALESCE(SUM(d.cantidad_recibida), 0)
            FROM detalle_recepcion_compra d
            JOIN recepcion_compra r USING (id_recepcion_compra)
            WHERE d.id_detalle_factura_proveedor = $2
                AND r.estado = 'REGISTRADA'
        )
        RETURNING *
        `,
        [
            idRecepcion,
            detalle.id_detalle_factura_proveedor,
            cantidad,
            detalle.cantidad,
            observacion
        ]
    );

    return result.rows[0] || null;
};

module.exports = {
    create
};
