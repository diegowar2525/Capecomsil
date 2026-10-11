const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos deben ser un objeto válido");
        error.status = 400;
        throw error;
    }

    const {
        nombre,
        estado
    } = data;

    if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        const error = new Error(
            "El nombre de la categoría es obligatorio"
        );
        error.status = 400;
        throw error;
    }

    if (
        estado !== undefined &&
        typeof estado !== "boolean"
    ) {
        const error = new Error(
            "El campo estado debe ser booleano"
        );
        error.status = 400;
        throw error;
    }

    if (
        data.descripcion !== undefined &&
        data.descripcion !== null &&
        typeof data.descripcion !== "string"
    ) {
        const error = new Error("El campo descripcion debe ser texto");
        error.status = 400;
        throw error;
    }

    if (data.es_llanta !== undefined && typeof data.es_llanta !== "boolean") {
        const error = new Error("es_llanta debe ser true o false");
        error.status = 400;
        throw error;
    }
    return {
        es_llanta: data.es_llanta ?? false,
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};