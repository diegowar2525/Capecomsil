const pool = require("../config/database");

// Identificadores SQL estáticos; nunca se interpolan parámetros de la petición.
const recursos = {
    choferes: { tabla: "chofer", columna: "id_chofer" },
    vehiculos: { tabla: "vehiculo", columna: "id_vehiculo" },
    productos: { tabla: "producto", columna: "id_producto" }
};

const findByRegistro = async (recurso, id, client = pool) => {
    const { tabla, columna } = recursos[recurso];
    const result = await client.query(
        `SELECT f.clave, f.url FROM catalogo_foto f
         JOIN ${tabla} r USING (${columna})
         WHERE f.${columna} = $1 AND r.imagen_url = f.url`, [id]
    );
    return result.rows[0] ?? null;
};

const lockRegistro = async (client, recurso, id) => {
    const { tabla, columna } = recursos[recurso];
    const result = await client.query(
        `SELECT ${columna} FROM ${tabla} WHERE ${columna} = $1 FOR UPDATE`, [id]
    );
    return result.rows[0] ?? null;
};

const updateImagen = async (client, recurso, id, url) => {
    const { tabla, columna } = recursos[recurso];
    const result = await client.query(
        `UPDATE ${tabla} SET imagen_url = $1 WHERE ${columna} = $2 RETURNING *`, [url, id]
    );
    return result.rows[0] ?? null;
};

const create = async (client, recurso, id, data) => {
    const { columna } = recursos[recurso];
    const result = await client.query(
        `INSERT INTO catalogo_foto(${columna}, clave, url)
         VALUES ($1, $2, $3) RETURNING id_foto`, [id, data.clave, data.url]
    );
    return result.rows[0];
};

module.exports = { findByRegistro, lockRegistro, updateImagen, create };
