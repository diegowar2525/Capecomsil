const validateData = (data) => {
    const {
        nombre,
        unidad_medida,
        estado
    } = data;

    if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        const error = new Error(
            "El nombre del producto transportado es obligatorio"
        );
        error.status = 400;
        throw error;
    }

    if (
        typeof unidad_medida !== "string" ||
        unidad_medida.trim() === ""
    ) {
        const error = new Error(
            "La unidad de medida es obligatoria"
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
};

module.exports = {
    validateData
};