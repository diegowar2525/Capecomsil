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
      kilometraje_base,
      to_char(fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km,
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
        kilometraje_base,
        to_char(fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km,
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
    kilometraje_base,
    fecha_inicio_control_km,
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
        kilometraje_base,
        fecha_inicio_control_km,
        imagen_url,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *, to_char(fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
            kilometraje_base,
            fecha_inicio_control_km,
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
        kilometraje_base,
        fecha_inicio_control_km,
        imagen_url,
        estado
    },
    client = pool
) => {
    const result = await client.query(
        `
      UPDATE vehiculo
      SET
        placa = $1,
        marca = $2,
        modelo = $3,
        anio = $4,
        capacidad_galones = $5,
        kilometraje_base = $6,
        fecha_inicio_control_km = $7,
        imagen_url = $8,

        estado = $9
      WHERE id_vehiculo = $10
      RETURNING *, to_char(fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km
    `,
        [
            placa,
            marca,
            modelo,
            anio,
            capacidad_galones,
            kilometraje_base,
            fecha_inicio_control_km,
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
      RETURNING *, to_char(fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km
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

const getKilometraje = async (id, hasta) => (await pool.query(`
    WITH corte AS (SELECT COALESCE($2::timestamp,CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil') hasta)
    SELECT v.id_vehiculo,v.placa,v.kilometraje_base,
        to_char(v.fecha_inicio_control_km,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_inicio_control_km,
        to_char(corte.hasta,'YYYY-MM-DD"T"HH24:MI:SS') AS fecha_corte,
        kilometraje_vehiculo(v.id_vehiculo,corte.hasta) AS kilometraje_estimado,
        kilometraje_vehiculo(v.id_vehiculo,corte.hasta)-v.kilometraje_base AS kilometros_acumulados,
        CASE WHEN v.fecha_inicio_control_km IS NULL OR corte.hasta<v.fecha_inicio_control_km THEN 'SIN_CONFIGURAR'
            ELSE 'CONFIGURADO' END AS estado_control
    FROM vehiculo v CROSS JOIN corte WHERE v.id_vehiculo=$1`,[id,hasta])).rows[0];

module.exports = {
    getKilometraje,
    getCapacidadViaje,
    findByIdForShare,
    findAll,
    findById,
    create,
    update,
    remove
};
