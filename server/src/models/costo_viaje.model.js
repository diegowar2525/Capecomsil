const pool = require("../config/database");
const { createHttpError } = require("../utils/errors/http.error");
const configuracionModel = require("./configuracion_combustible.model");

const crearAutomaticos = async (client, id, fecha) => {
    const config = await configuracionModel.findVigenteForShare(client, fecha);
    if (!config) throw createHttpError("No existe configuración de combustible vigente para la fecha del viaje", 409);
    // NUMERIC en PostgreSQL: redondeo de galones a 6 decimales e importe final a centavos.
    await client.query(`
        INSERT INTO costo_viaje (
            id_viaje,
            tipo_costo,
            valor,descripcion,
            id_configuracion_combustible,
            kilometros_aplicados,
            consumo_galones_km_aplicado,
            precio_por_galon_aplicado,
            galones_estimados
        )
        SELECT $1,'COMBUSTIBLE',round(round(sum(kilometros)*$3::numeric,6)*$4::numeric,2),
            'Combustible estimado del recorrido',$2,sum(kilometros),$3,$4,round(sum(kilometros)*$3::numeric,6)
        FROM tramo_viaje WHERE id_viaje=$1`,
        [id, config.id_configuracion_combustible, config.consumo_galones_km, config.precio_por_galon]);
    await client.query(`
        INSERT INTO costo_viaje(
            id_viaje,
            tipo_costo,
            valor,
            descripcion
        )
        SELECT $1,'PEAJE',sum(peaje_aplicado),'Peajes del recorrido'
        FROM tramo_viaje WHERE id_viaje=$1`, [id]);
};

const findByViaje = async (id, client = pool) => {
    return (await client.query("SELECT * FROM costo_viaje WHERE id_viaje=$1 ORDER BY id_costo", [id])).rows;
};

module.exports = { 
    findByViaje, 
    crearAutomaticos 
};
