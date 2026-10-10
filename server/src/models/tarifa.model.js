const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(`
        SELECT
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
        FROM tarifa
        ORDER BY id_tarifa DESC
    `);

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
        FROM tarifa
        WHERE id_tarifa = $1
        `,
        [id]
    );

    return result.rows[0];
};

const create = async ({
    id_gasolinera,
    id_terminal,
    valor_por_galon,
    fecha_inicio,
    fecha_fin,
    estado
}) => {
    const result = await pool.query(
        `
        INSERT INTO tarifa (
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio,
            fecha_fin,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
        `,
        [
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio,
            fecha_fin,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (
    id,
    {
        id_gasolinera,
        id_terminal,
        valor_por_galon,
        fecha_inicio,
        fecha_fin,
        estado
    }
) => {
    const result = await pool.query(
        `
        UPDATE tarifa
        SET
            id_gasolinera = $1,
            id_terminal = $2,
            valor_por_galon = $3,
            fecha_inicio = $4,
            fecha_fin = $5,
            estado = $6
        WHERE id_tarifa = $7
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
        `,
        [
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio,
            fecha_fin,
            estado,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM tarifa
        WHERE id_tarifa = $1
        RETURNING
            id_tarifa,
            id_gasolinera,
            id_terminal,
            valor_por_galon,
            fecha_inicio::text,
            fecha_fin::text,
            estado
        `,
        [id]
    );

    return result.rows[0];
};

const findVigenteForUpdate = async (client, gasolinera, terminal, fecha) => {
    return (await client.query(`
        SELECT * FROM tarifa
        WHERE 
        id_gasolinera=$1 AND id_terminal=$2 AND fecha_inicio <= $3::date
        AND (fecha_fin IS NULL OR fecha_fin >= $3::date)
        ORDER BY id_tarifa FOR UPDATE`, [gasolinera, terminal, fecha])).rows[0];
};

module.exports = {
    findVigenteForUpdate,
    findAll,
    findById,
    create,
    update,
    remove
};
