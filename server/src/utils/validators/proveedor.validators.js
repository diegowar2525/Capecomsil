const validateData = (data) => {
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
};

module.exports = {
    validateData
};