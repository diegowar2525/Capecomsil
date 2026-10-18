const costoModel = require("../models/costo_viaje.model");
const configuracionModel = require("../models/configuracion_combustible.model");
const { createHttpError } = require("../utils/errors/http.error");

// Participa en la transacción abierta por viajes; no confirma ni libera el client.
const crearAutomaticos = async (client, idViaje, fecha) => {
    const config = await configuracionModel.findVigenteForShare(client, fecha);
    if (!config) {
        throw createHttpError(
            "No existe configuración de combustible vigente para la fecha del viaje",
            409
        );
    }

    await costoModel.createCombustible(client, idViaje, config);
    await costoModel.createPeaje(client, idViaje);
};

module.exports = { crearAutomaticos };
