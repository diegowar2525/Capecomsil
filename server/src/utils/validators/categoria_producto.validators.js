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

    return {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};