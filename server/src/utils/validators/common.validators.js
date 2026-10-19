const { createHttpError } = require("../errors/http.error");

const validateId = (id) => {
    const idNumerico = Number(id);
    if (
        !["string", "number"].includes(typeof id) ||
        !/^\d+$/.test(String(id)) ||
        !Number.isSafeInteger(idNumerico) ||
        idNumerico <= 0 ||
        idNumerico > 2147483647
    ) {
        throw createHttpError("El ID debe ser un entero positivo válido", 400);
    }
    return idNumerico;
};

const validateDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000")
    ) {
        throw createHttpError("Las fechas deben tener formato YYYY-MM-DD", 400);
    }
    const fecha = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== value) {
        throw createHttpError("La fecha no existe en el calendario", 400);
    }
    return value;
};

// Hora local del negocio, sin conversión implícita por zona horaria.
const validateDateTime = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)
    ) {
        throw createHttpError(
            "La fecha debe tener formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss, sin zona horaria",
            400
        );
    }
    const fecha = validateDate(value.slice(0, 10));
    const hora =
        value.length === 10
            ? "00:00:00"
            : value.slice(11, 16) + (value.length === 16 ? ":00" : value.slice(16));
    const [h, m, s] = hora.split(":").map(Number);
    if (h > 23 || m > 59 || s > 59) {
        throw createHttpError("La hora no es válida", 400);
    }
    return `${fecha}T${hora}`;
};

const validateDecimal = (value, campo, enteros, decimales) => {
    const formato = new RegExp(`^\\d{1,${enteros}}(\\.\\d{1,${decimales}})?$`);
    if (!["string", "number"].includes(typeof value) || !formato.test(String(value))) {
        throw createHttpError(
            `El campo ${campo} debe ser un decimal no negativo con máximo ${decimales} decimales`,
            400
        );
    }
    return String(value);
};

const validateOptionalText = (value, campo, maximo) => {
    if (value == null) {
        return null;
    }
    if (typeof value !== "string" || (maximo && value.trim().length > maximo)) {
        throw createHttpError(
            `El campo ${campo} debe ser texto${maximo ? ` de máximo ${maximo} caracteres` : ""}`,
            400
        );
    }
    return value.trim() || null;
};

const validateImagenUrl = (value) => {
    const text = validateOptionalText(value, "imagen_url", 2048);
    if (text === null) {
        return null;
    }
    try {
        const url = new URL(text);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
            throw new Error();
        }
    } catch {
        throw createHttpError("imagen_url debe ser una URL HTTP o HTTPS válida", 400);
    }
    return text;
};

module.exports = {
    validateDateTime,
    validateImagenUrl,
    validateId,
    validateDate,
    validateDecimal,
    validateOptionalText
};
