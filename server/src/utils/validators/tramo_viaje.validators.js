const { validateId, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateTramos = (data, detalles) => {
    if (!Array.isArray(data) || !data.length) throw createHttpError("El viaje debe tener tramos", 400);
    const tramos = data.map(tramo => {
        if (!tramo || typeof tramo !== "object" || Array.isArray(tramo)) throw createHttpError("Tramo inválido", 400);
        const resultado = { orden: validateId(tramo.orden) };
        for (const campo of ["id_terminal_origen", "id_gasolinera_origen", "id_terminal_destino", "id_gasolinera_destino"]) {
            resultado[campo] = tramo[campo] == null ? null : validateId(tramo[campo]);
        }
        for (const extremo of ["origen", "destino"]) {
            if ((resultado[`id_terminal_${extremo}`] !== null) === (resultado[`id_gasolinera_${extremo}`] !== null)) {
                throw createHttpError(`Indique exactamente un terminal o una gasolinera como ${extremo}`, 400);
            }
        }
        if (resultado.id_terminal_origen === resultado.id_terminal_destino && resultado.id_gasolinera_origen === resultado.id_gasolinera_destino) {
            throw createHttpError("Origen y destino del tramo deben ser distintos", 400);
        }
        resultado.kilometros = validateDecimal(tramo.kilometros, "kilometros", 8, 2);
        if (/^0+(\.0+)?$/.test(resultado.kilometros)) throw createHttpError("Los kilómetros deben ser mayores que cero", 400);
        resultado.observacion = validateOptionalText(tramo.observacion, "observacion");
        return resultado;
    }).sort((a, b) => a.orden - b.orden);
    if (!tramos[0].id_gasolinera_origen || !tramos[0].id_terminal_destino) {
        throw createHttpError("El recorrido debe comenzar en una gasolinera hacia un terminal", 400);
    }
    tramos.forEach((tramo, index) => {
        if (tramo.orden !== index + 1) throw createHttpError("El orden de los tramos debe ser consecutivo desde 1", 400);
        const anterior = tramos[index - 1];
        if (anterior && (anterior.id_terminal_destino !== tramo.id_terminal_origen || anterior.id_gasolinera_destino !== tramo.id_gasolinera_origen)) {
            throw createHttpError("Los tramos deben ser continuos", 400);
        }
    });
    for (const detalle of detalles) {
        if (!tramos.some(carga => carga.id_terminal_destino === detalle.id_terminal && tramos.some(entrega =>
            entrega.orden > carga.orden && entrega.id_gasolinera_destino === detalle.id_gasolinera))) {
            throw createHttpError("El recorrido debe visitar el terminal antes de la gasolinera de cada entrega", 400);
        }
    }
    return tramos;
};

module.exports = { validateTramos };
