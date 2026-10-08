const pool = require("../config/database");

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

const findByFactura = async (id) => {
    const result = await pool.query(
        `
        SELECT r.*, COALESCE((
            SELECT jsonb_agg(to_jsonb(d) || jsonb_build_object(
                'cantidad_recibida', d.cantidad_recibida::text
            ) ORDER BY d.id_detalle_recepcion_compra)
            FROM detalle_recepcion_compra d
            WHERE d.id_recepcion_compra = r.id_recepcion_compra
        ), '[]'::jsonb) AS detalles
        FROM recepcion_compra r
        WHERE r.id_factura_proveedor = $1
        ORDER BY r.fecha_recepcion, r.id_recepcion_compra
        `,
        [id]
    );

    return result.rows;
};

const findForUpdate = async (client, id) => {
    const result = await client.query("SELECT * FROM recepcion_compra WHERE id_recepcion_compra=$1 FOR UPDATE", [id]);
    return result.rows[0];
};

const anular = async (client, id, motivo) => {
    const result = await client.query(
        "UPDATE recepcion_compra SET estado='ANULADA', fecha_anulacion=CURRENT_TIMESTAMP, motivo_anulacion=$2 WHERE id_recepcion_compra=$1 RETURNING *",
        [id, motivo]
    );
    return result.rows[0];
};

module.exports = {
    findForUpdate,
    anular,
    findByFactura,
    create
};
