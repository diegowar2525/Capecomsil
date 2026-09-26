const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del vehículo son obligatorios");
        error.status = 400;
        throw error;
    }

    const {
        placa,
        marca,
        modelo,
        anio,
        capacidad_galones,
        estado
    } = data;

    if (
        typeof placa !== "string" || !placa.trim() ||
        typeof marca !== "string" || !marca.trim() ||
        typeof modelo !== "string" || !modelo.trim()
    ) {
        const error = new Error(
            "Placa, marca y modelo son obligatorios y deben ser texto"
        );
        error.status = 400;
        throw error;
    }

    const anioNumerico = Number(anio);
    const capacidadNumerica = Number(capacidad_galones);

    if (
        anio === undefined ||
        !Number.isInteger(anioNumerico) ||
        anioNumerico <= 0
    ) {
        const error = new Error("El año debe ser un número entero válido");
        error.status = 400;
        throw error;
    }

    if (
        capacidad_galones === undefined ||
        !Number.isFinite(capacidadNumerica) ||
        capacidadNumerica <= 0
    ) {
        const error = new Error(
            "La capacidad en galones debe ser un número mayor que cero"
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
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anioNumerico,
        capacidad_galones: capacidadNumerica,
        estado: estado ?? true
    };
};

module.exports = { validateData };