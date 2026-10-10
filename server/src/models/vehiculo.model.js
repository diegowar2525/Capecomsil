const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(`
    SELECT
      id_vehiculo,
      placa,
      marca,
      modelo,
      anio,
      capacidad_galones,
      imagen_url,
      estado
    FROM vehiculo
    ORDER BY id_vehiculo DESC
  `);

    return result.rows;
};

const findById = async (id) => {
    const result = await pool.query(
        `
      SELECT
        id_vehiculo,
        placa,
        marca,
        modelo,
        anio,
        capacidad_galones,
        imagen_url,
        estado
      FROM vehiculo
      WHERE id_vehiculo = $1
    `,
        [id]
    );

    return result.rows[0];
};

const create = async ({
    placa,
    marca,
    modelo,
    anio,
    capacidad_galones,
    imagen_url,
    estado
}) => {
    const result = await pool.query(
        `
      INSERT INTO vehiculo (
        placa,
        marca,
        modelo,
        anio,
        capacidad_galones,
        imagen_url,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
            imagen_url,
            estado
        ]
    );

    return result.rows[0];
};

const update = async (
    id,
    {
        placa,
        marca,
        modelo,
        anio,
        capacidad_galones,
        imagen_url,
        estado
    }
) => {
    const result = await pool.query(
        `
      UPDATE vehiculo
      SET
        placa = $1,
        marca = $2,
        modelo = $3,
        anio = $4,
        capacidad_galones = $5,
        imagen_url = $6,

        estado = $7
      WHERE id_vehiculo = $8
      RETURNING *
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
            imagen_url,
            estado,
            id
        ]
    );

    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query(
        `
      DELETE FROM vehiculo
      WHERE id_vehiculo = $1
      RETURNING *
    `,
        [id]
    );

    return result.rows[0];
};

const findByIdForShare = async (client, id) => {
    const result = await client.query(
        "SELECT id_vehiculo FROM vehiculo WHERE id_vehiculo = $1 FOR SHARE",
        [id]
    );

    return result.rows[0];
};

const getCapacidadViaje = async (client, id, cantidades) => {
    // El vehículo debe permanecer bloqueado mientras se valida y registra el viaje.
    return (await client.query(`SELECT capacidad_galones,
        capacidad_galones >= (SELECT SUM(n) FROM unnest($2::numeric[]) AS n) AS suficiente
        FROM vehiculo WHERE id_vehiculo=$1`, [id, cantidades])).rows[0];
};

module.exports = {
    getCapacidadViaje,
    findByIdForShare,
    findAll,
    findById,
    create,
    update,
    remove
};
