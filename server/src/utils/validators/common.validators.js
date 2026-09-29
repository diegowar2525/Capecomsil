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

const validateDecimal = (value, campo, enteros, decimales) => {
    const formato = new RegExp(`^\\d{1,${enteros}}(\\.\\d{1,${decimales}})?$`);
    if (!["string", "number"].includes(typeof value) || !formato.test(String(value))) {
        const error = new Error(`El campo ${campo} debe ser un decimal no negativo con máximo ${decimales} decimales`);
        error.status = 400;
        throw error;
    }
    return String(value);
};

module.exports = {
    validateId,
    validateDate,
    validateDecimal
};


