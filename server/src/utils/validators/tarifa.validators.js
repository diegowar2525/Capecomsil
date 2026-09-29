const { validateId } = require("./common.validators");

const validateDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000")
    ) {
        const error = new Error("Las fechas deben tener formato YYYY-MM-DD");
        error.status = 400;
        throw error;
    }

    const fecha = new Date(`${value}T00:00:00Z`);

    if (
        !Number.isFinite(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== value
    ) {
        const error = new Error("La fecha no existe en el calendario");
        error.status = 400;
        throw error;
    }

    return value;
};

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos de la tarifa son obligatorios");
        error.status = 400;
        throw error;
    }

    const {
        id_gasolinera,
        id_terminal,
        valor_por_galon,
        fecha_inicio,
        fecha_fin,
        estado
    } = data;

    const idGasolineraNumerico = validateId(id_gasolinera);
    const idTerminalNumerico = validateId(id_terminal);

    if (
        !["string", "number"].includes(typeof valor_por_galon) ||
        !/^\d{1,8}(\.\d{1,4})?$/.test(String(valor_por_galon))
    ) {
        const error = new Error(
            "El valor por galón debe ser no negativo, con máximo 8 enteros y 4 decimales"
        );
        error.status = 400;
        throw error;
    }

    const fechaInicioValidada = validateDate(fecha_inicio);
    const fechaFinValidada = fecha_fin == null
        ? null
        : validateDate(fecha_fin);

    if (fechaFinValidada && fechaFinValidada < fechaInicioValidada) {
        const error = new Error(
            "La fecha final no puede ser anterior a la inicial"
        );
        error.status = 400;
        throw error;
    }

    if (estado !== undefined && typeof estado !== "boolean") {
        const error = new Error("El estado debe ser true o false");
        error.status = 400;
        throw error;
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
