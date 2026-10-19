const { createHttpError } = require("../errors/http.error");
const { validateId, validateDate } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos de la tarifa son obligatorios", 400);
    }
    const { id_gasolinera, id_terminal, valor_por_galon, fecha_inicio, fecha_fin, estado } = data;
    const idGasolineraNumerico = validateId(id_gasolinera);
    const idTerminalNumerico = validateId(id_terminal);
    if (
        !["string", "number"].includes(typeof valor_por_galon) ||
        !/^\d{1,8}(\.\d{1,4})?$/.test(String(valor_por_galon))
    ) {
        throw createHttpError(
            "El valor por galón debe ser no negativo, con máximo 8 enteros y 4 decimales",
            400
        );
    }
    const fechaInicioValidada = validateDate(fecha_inicio);
    const fechaFinValidada = fecha_fin == null ? null : validateDate(fecha_fin);
    if (fechaFinValidada && fechaFinValidada < fechaInicioValidada) {
        throw createHttpError("La fecha final no puede ser anterior a la inicial", 400);
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El estado debe ser true o false", 400);
    }
    return {
        id_gasolinera: idGasolineraNumerico,
        id_terminal: idTerminalNumerico,
        valor_por_galon: String(valor_por_galon),
        fecha_inicio: fechaInicioValidada,
        fecha_fin: fechaFinValidada,
        estado: estado ?? true
    };
};

module.exports = {
    validateId,
    validateData
};
