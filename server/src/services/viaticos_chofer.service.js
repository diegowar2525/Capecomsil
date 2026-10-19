const viaticoModel = require("../models/viatico_chofer.model");
const configuracionModel = require("../models/configuracion_viatico.model");
const viajeModel = require("../models/viaje.model");
const costoModel = require("../models/costo_viaje.model");
const { createHttpError } = require("../utils/errors/http.error");

// El llamador mantiene la transacción y el bloqueo compartido con remuneraciones.
const recalcular = async (client, idChofer, fecha) => {
    let diario = await viaticoModel.findByChoferFechaForUpdate(client, idChofer, fecha);
    const cantidadViajes = await viajeModel.countRegistradosByChoferFecha(client, idChofer, fecha);
    if (!diario && !cantidadViajes) {
        return;
    }
    if (!diario) {
        const config = await configuracionModel.findVigenteForShare(client, fecha);
        if (!config) {
            throw createHttpError(
                "No existe configuración de viático vigente para la fecha del viaje",
                409
            );
        }
        diario = await viaticoModel.create(client, idChofer, fecha, config);
    }
    await viaticoModel.updateTotalPorViajes(client, diario.id_viatico_chofer, cantidadViajes);
    await costoModel.removeViaticosDeViajesAnulados(client, diario.id_viatico_chofer);
    if (!cantidadViajes) {
        return;
    }
    await costoModel.asignarViaticoDiario(client, idChofer, fecha, diario, cantidadViajes);

};

module.exports = {
    recalcular
};
