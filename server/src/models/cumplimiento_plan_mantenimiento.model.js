const pool = require("../config/database");

const create = async (client, idMantenimiento, idPlan) => {
    const result = await client.query(
        `
        INSERT INTO
            cumplimiento_plan_mantenimiento (id_mantenimiento, id_plan_mantenimiento_vehiculo)
        VALUES
            ($1, $2)
        RETURNING
            *
    `,
        [idMantenimiento, idPlan]
    );

    return result.rows[0] ?? null;
};

const findByMantenimiento = async (id, client = pool) => {
    const result = await client.query(
        `
        SELECT
            c.*,
            p.nombre AS nombre_plan
        FROM
            cumplimiento_plan_mantenimiento c
            JOIN plan_mantenimiento_vehiculo p USING (id_plan_mantenimiento_vehiculo)
        WHERE
            c.id_mantenimiento = $1
        ORDER BY
            c.id_plan_mantenimiento_vehiculo
    `,
        [id]
    );

    return result.rows;
};

module.exports = {
    create,
    findByMantenimiento
};
