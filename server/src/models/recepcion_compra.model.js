const create = async (client, id, fecha) => {
    const result = await client.query(`INSERT INTO recepcion_compra(id_factura_proveedor,fecha_recepcion)
        VALUES ($1,$2) RETURNING *`, [id, fecha]);
    return result.rows[0];
};

module.exports = {
    create
};
