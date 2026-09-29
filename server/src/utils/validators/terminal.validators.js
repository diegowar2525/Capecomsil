const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del terminal son obligatorios");
        error.status = 400;
        throw error;
    }

    const { nombre, ubicacion, estado } = data;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof ubicacion !== "string" ||
        !ubicacion.trim()
    ) {
        const error = new Error(
            "El nombre y la ubicación son obligatorios"
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
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};