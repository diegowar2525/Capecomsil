const create = async (client, idRecepcion, detalle, cantidad) => {
    const result = await client.query(
        `
        INSERT INTO detalle_recepcion_compra (
            id_recepcion_compra,
            id_detalle_factura_proveedor,
            cantidad_recibida
        )
        SELECT $1::integer, $2::integer, $3::numeric
        WHERE $3::numeric <= $4::numeric
        RETURNING *
        `,
        [
            idRecepcion,
            detalle.id_detalle_factura_proveedor,
            cantidad,
            detalle.cantidad
        ]
    );

    return result.rows[0] || null;
};

module.exports = {
    create
};
