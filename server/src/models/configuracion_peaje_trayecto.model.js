const findVigenteForShare = async (client, id, fecha) => {
    return (await client.query(`SELECT * FROM configuracion_peaje_trayecto
        WHERE id_trayecto=$1 AND fecha_inicio <= $2::date
        AND (fecha_fin IS NULL OR fecha_fin >= $2::date) FOR SHARE`, [id, fecha])).rows[0];
};
module.exports = { findVigenteForShare };
