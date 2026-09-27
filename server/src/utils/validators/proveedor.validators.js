const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos deben ser un objeto válido");
        error.status = 400;
        throw error;
    }

    const {
        nombre,
        ruc,
        estado
    } = data;

    if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        const error = new Error(
            "El nombre del proveedor es obligatorio"
        );
        error.status = 400;
        throw error;
    }

    if (
        typeof ruc !== "string" ||
        ruc.trim() === ""
    ) {
        const error = new Error(
            "El RUC del proveedor es obligatorio"
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
        data.direccion !== undefined &&
        data.direccion !== null &&
        typeof data.direccion !== "string"
    ) {
        const error = new Error("El campo direccion debe ser texto");
        error.status = 400;
        throw error;
    }

    if (
        data.telefono !== undefined &&
        data.telefono !== null &&
        typeof data.telefono !== "string"
    ) {
        const error = new Error("El campo telefono debe ser texto");
        error.status = 400;
        throw error;
    }

    if (
        data.correo !== undefined &&
        data.correo !== null &&
        typeof data.correo !== "string"
    ) {
        const error = new Error("El campo correo debe ser texto");
        error.status = 400;
        throw error;
    }

    return {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        correo: data.correo?.trim() || null,
        estado: (estado ?? true) ? "ACTIVO" : "INACTIVO"
    };
};

module.exports = {
    validateData
};