const { validateId, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateTramos = (data) => {
    if (!Array.isArray(data) || !data.length) {
        throw createHttpError("El viaje debe tener tramos", 400);
    }
    const tramos = data
        .map((tramo) => {
            if (!tramo || typeof tramo !== "object" || Array.isArray(tramo)) {
                throw createHttpError("Tramo inválido", 400);
            }
            const resultado = {
                orden: validateId(tramo.orden),
                id_trayecto: validateId(tramo.id_trayecto)
            };
            resultado.observacion = validateOptionalText(tramo.observacion, "observacion");
            return resultado;
        })
        .sort((a, b) => a.orden - b.orden);
    tramos.forEach((tramo, index) => {
        if (tramo.orden !== index + 1) {
            throw createHttpError("El orden de los tramos debe ser consecutivo desde 1", 400);
        }
    });
    return tramos;
};

const validateRecorrido = (tramos, detalles) => {
    tramos.forEach((tramo, index) => {
        if (tramo.orden !== index + 1) {
            throw createHttpError("El orden de los tramos debe ser consecutivo desde 1", 400);
        }
        const anterior = tramos[index - 1];
        if (
            anterior &&
            (anterior.id_terminal_destino !== tramo.id_terminal_origen ||
                anterior.id_gasolinera_destino !== tramo.id_gasolinera_origen)
        ) {
            throw createHttpError("Los tramos deben ser continuos", 400);
        }
    });
    for (const detalle of detalles) {
        if (
            !tramos.some(
                (entrega) =>
                    entrega.id_gasolinera_destino === detalle.id_gasolinera &&
                    tramos.some(
                        (carga) =>
                            (carga.id_terminal_origen === detalle.id_terminal &&
                                carga.orden <= entrega.orden) ||
                            (carga.id_terminal_destino === detalle.id_terminal &&
                                carga.orden < entrega.orden)
                    )
            )
        ) {
            throw createHttpError(
                "El recorrido debe visitar el terminal antes de la gasolinera de cada entrega",
                400
            );
        }
    }
    return tramos;
};

module.exports = {
    validateTramos,
    validateRecorrido
};
