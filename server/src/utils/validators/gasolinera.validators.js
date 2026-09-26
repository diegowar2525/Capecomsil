const validateData = (data) => {
    const {
        nombre,
        ruc,
        agente_retencion,
        estado
    } = data;

    if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        const error = new Error(
            "El nombre de la gasolinera es obligatorio"
        );
        error.status = 400;
        throw error;
    }

    if (
        typeof ruc !== "string" ||
        ruc.trim() === ""
    ) {
        const error = new Error(
            "El RUC de la gasolinera es obligatorio"
        );
        error.status = 400;
        throw error;
    }

    if (
        agente_retencion !== undefined &&
        typeof agente_retencion !== "boolean"
    ) {
        const error = new Error(
            "El campo agente_retencion debe ser booleano"
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