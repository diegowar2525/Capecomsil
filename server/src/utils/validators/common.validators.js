const validateId = (id) => {
    const idNumerico = Number(id);

    if (
        !["string", "number"].includes(typeof id) ||
        !/^\d+$/.test(String(id)) ||
        !Number.isSafeInteger(idNumerico) ||
        idNumerico <= 0 ||
        idNumerico > 2147483647
    ) {
        const error = new Error("El ID debe ser un entero positivo válido");
        error.status = 400;
        throw error;
    }

    return idNumerico;
};

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

// Hora local del negocio, sin conversión implícita por zona horaria.
const validateDateTime = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)) {
        const error = new Error("La fecha debe tener formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss, sin zona horaria");
        error.status = 400;
        throw error;
    }
    const fecha = validateDate(value.slice(0, 10));
    const hora = value.length === 10 ? "00:00:00" : value.slice(11, 16) + (value.length === 16 ? ":00" : value.slice(16));
    const [h, m, s] = hora.split(":").map(Number);
    if (h > 23 || m > 59 || s > 59) {
        const error = new Error("La hora no es válida");
        error.status = 400;
        throw error;
    }
    return `${fecha}T${hora}`;
};

const validateDecimal = (value, campo, enteros, decimales) => {
    const formato = new RegExp(`^\\d{1,${enteros}}(\\.\\d{1,${decimales}})?$`);
    if (!["string", "number"].includes(typeof value) || !formato.test(String(value))) {
        const error = new Error(`El campo ${campo} debe ser un decimal no negativo con máximo ${decimales} decimales`);
        error.status = 400;
        throw error;
    }
    return String(value);
};

const validateOptionalText = (value, campo, maximo) => {
    if (value == null) return null;
    if (typeof value !== "string" || (maximo && value.trim().length > maximo)) {
        const error = new Error(`El campo ${campo} debe ser texto${maximo ? ` de máximo ${maximo} caracteres` : ""}`);
        error.status = 400;
        throw error;
    }
    return value.trim() || null;
};

const validateImagenUrl = (value) => {
    const text = validateOptionalText(value, "imagen_url", 2048);
    if (text === null) return null;
    try {
        const url = new URL(text);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
        const error = new Error("imagen_url debe ser una URL HTTP o HTTPS válida");
        error.status = 400;
        throw error;
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


