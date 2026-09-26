const validateId = (id) => {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        const error = new Error("El ID del chofer no es válido.");
        error.status = 400;
        throw error;
    }

    return idNumerico;
};

const validateData = (data) => {
    const {
        nombre,
        cedula,
        telefono,
        tipo_remuneracion,
        estado,
    } = data;

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof cedula !== "string" ||
        !cedula.trim() ||
        typeof tipo_remuneracion !== "string" ||
        !tipo_remuneracion.trim()
    ) {
        const error = new Error(
            "Nombre, cédula y tipo de remuneración son obligatorios."
        );
        error.status = 400;
        throw error;
    }

    if (
        telefono !== undefined &&
        telefono !== null &&
        typeof telefono !== "string"
    ) {
        const error = new Error("El teléfono debe ser texto.");
        error.status = 400;
        throw error;
    }

    if (estado !== undefined && typeof estado !== "boolean") {
        const error = new Error("El estado debe ser true o false.");
        error.status = 400;
        throw error;
    }

    return {
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono?.trim() || null,
        tipo_remuneracion: tipo_remuneracion.trim(),
        estado: estado ?? true,
    };
};

module.exports = {
    validateId,
    validateData
}