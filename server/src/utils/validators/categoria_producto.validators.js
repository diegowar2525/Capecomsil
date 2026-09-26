const validateData = (data) => {
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
};

module.exports = {
    validateData
};