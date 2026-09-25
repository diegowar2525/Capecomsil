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
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
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
        estado = $6
      WHERE id_vehiculo = $7
      RETURNING *
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
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

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};