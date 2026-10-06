const create = async (client, data) => {
    const result = await client.query(
        `
        INSERT INTO recepcion_compra (
            id_factura_proveedor, fecha_recepcion, numero_comprobante, observacion
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [data.id_factura_proveedor, data.fecha_recepcion, data.numero_comprobante, data.observacion]
    );
    return result.rows[0];
};

module.exports = {
    create
};
