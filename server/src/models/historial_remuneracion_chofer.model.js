const pool = require("../config/database");

const findByRemuneracion = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            *
        FROM
            historial_remuneracion_chofer
        WHERE
            id_remuneracion_chofer = $1
        ORDER BY
            id_historial_remuneracion_chofer
    `,
        [id]
    );

    return result.rows;
};

module.exports = {
    findByRemuneracion
};
