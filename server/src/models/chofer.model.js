const pool = require("../config/database");

const findAll = async () => {
  const result = await pool.query(`
        SELECT
            id_chofer,
            nombre,
            cedula,
            telefono,
            tipo_remuneracion,
            imagen_url,
            estado
        FROM chofer
        ORDER BY id_chofer DESC
    `);

  return result.rows;
};

const findById = async (id) => {
  const query = `
    SELECT
      id_chofer,
      nombre,
      cedula,
      telefono,
      tipo_remuneracion,
      imagen_url,
      estado
    FROM chofer
    WHERE id_chofer = $1;
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

const create = async ({
  nombre,
  cedula,
  telefono,
  tipo_remuneracion,
  imagen_url,
  estado,
}) => {
  const result = await pool.query(
    `
    INSERT INTO chofer (
      nombre,
      cedula,
      telefono,
      tipo_remuneracion,
      imagen_url,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `,
    [
      nombre,
      cedula,
      telefono,
      tipo_remuneracion,
      imagen_url,
      estado,
    ]
  );

  return result.rows[0];
};

const update = async (
  id,
  {
    nombre,
    cedula,
    telefono,
    tipo_remuneracion,
    imagen_url,
    estado
  }
) => {
  const result = await pool.query(
    `
    UPDATE chofer
    SET
      nombre = $1,
      cedula = $2,
      telefono = $3,
      tipo_remuneracion = $4,
      imagen_url = $5,

      estado = $6
    WHERE id_chofer = $7
    RETURNING *;
  `,
    [
      nombre,
      cedula,
      telefono,
      tipo_remuneracion,
      imagen_url,
      estado,
      id,
    ]
  );

  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM chofer
    WHERE id_chofer = $1
    RETURNING *;
  `,
    [id]
  );

  return result.rows[0];
};

const findByIdForShare = async (client, id) => {
  return (await client.query("SELECT id_chofer FROM chofer WHERE id_chofer=$1 FOR SHARE", [id])).rows[0];
};

module.exports = {
  findByIdForShare,
  findAll,
  findById,
  create,
  update,
  remove,
};
